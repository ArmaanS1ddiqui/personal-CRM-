import React, { useEffect, useState } from 'react';
import { createWorker } from 'tesseract.js';
import { useStore } from '../store/useStore';
import { v4 as uuidv4 } from 'uuid';
import { Loader2 } from 'lucide-react';

export const OCRScanner: React.FC = () => {
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);

  const activeBoardId = useStore(state => state.activeBoardId);
  const boards = useStore(state => state.boards);
  const stages = useStore(state => state.stages);
  const addCard = useStore(state => state.addCard);

  useEffect(() => {
    const handlePaste = async (e: ClipboardEvent) => {
      const items = e.clipboardData?.items;
      if (!items) return;

      let imageBlob: Blob | null = null;
      for (let i = 0; i < items.length; i++) {
        if (items[i].type.indexOf('image') !== -1) {
          imageBlob = items[i].getAsFile();
          break;
        }
      }

      if (!imageBlob || !activeBoardId) return;

      const imageUrl = URL.createObjectURL(imageBlob);
      processImage(imageUrl);
    };

    window.addEventListener('paste', handlePaste);
    return () => window.removeEventListener('paste', handlePaste);
  }, [activeBoardId, boards]);

  const handleManualPasteTrigger = async () => {
    try {
      if (!activeBoardId) return;
      const items = await navigator.clipboard.read();
      for (const item of items) {
        if (item.types.includes('image/png') || item.types.includes('image/jpeg')) {
          const blob = await item.getType(item.types.find(t => t.startsWith('image/')) as string);
          const imageUrl = URL.createObjectURL(blob);
          processImage(imageUrl);
          return;
        }
      }
      alert("No image found in clipboard. Please copy an image first.");
    } catch (err) {
      console.error("Clipboard read failed:", err);
      alert("Unable to read clipboard. Please use Ctrl+V/Cmd+V to paste the image directly.");
    }
  };

  const processImage = async (imageUrl: string) => {
    setIsProcessing(true);
    setProgress(0);

    try {
      const worker = await createWorker('eng', 1, {
        logger: (m: any) => {
          if (m.status === 'recognizing text') {
            setProgress(Math.round(m.progress * 100));
          }
        }
      });

      const { data: { text } } = await worker.recognize(imageUrl);
      await worker.terminate();

      await parseTextWithGeminiAndCreateCard(text);
    } catch (err) {
      console.error("OCR Failed", err);
      alert("OCR Processing failed. Please try again.");
    } finally {
      setIsProcessing(false);
      setProgress(0);
      URL.revokeObjectURL(imageUrl);
    }
  };

  const parseTextWithGeminiAndCreateCard = async (text: string) => {
    const activeBoard = boards.find(b => b.id === activeBoardId);
    if (!activeBoard) return;

    // Use board form fields if defined, else use fallback defaults
    const requestedFields = activeBoard.formFields && activeBoard.formFields.length > 0 
      ? activeBoard.formFields 
      : ['Company Name', 'Job Role', 'Source'];

    let parsedResult: Record<string, string> = {};

    try {
      const prompt = `
        You are an AI assistant that extracts information from raw OCR text of a screenshot.
        
        The user wants to extract the following specific fields from the text:
        ${requestedFields.map((f, i) => `${i + 1}. ${f}`).join('\n        ')}
        
        Return the response AS A JSON OBJECT EXACTLY in the following format, with no markdown formatting or extra text.
        Make the JSON keys exactly match the requested field names. 
        If a field's information cannot be found in the text, put "Unknown".
        
        Example Output Format:
        {
          ${requestedFields.map(f => `"${f}": "extracted value"`).join(',\n          ')}
        }
        
        Raw OCR Text:
        """
        ${text}
        """
      `;

      const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${import.meta.env.VITE_GEMINI_API_KEY}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contents: [{
            parts: [{ text: prompt }]
          }],
          generationConfig: {
            responseMimeType: "application/json"
          }
        })
      });

      if (!response.ok) {
        throw new Error(`API returned ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      
      if (data.candidates && data.candidates.length > 0) {
        let jsonText = data.candidates[0].content.parts[0].text;
        parsedResult = JSON.parse(jsonText);
      }
    } catch (error) {
      console.error("Error calling Gemini API:", error);
    }

    // Creating Card payload mapping back to requested fields
    const fields = requestedFields.map(fieldName => ({
      id: uuidv4(),
      name: fieldName,
      value: parsedResult[fieldName] || 'Unknown'
    }));
    
    // Always append raw text source
    fields.push({ 
      id: uuidv4(), 
      name: 'Extracted Text', 
      value: text.length > 100 ? text.substring(0, 100) + '...' : text 
    });

    // Find first stage of active board
    const boardStages = stages.filter(s => s.boardId === activeBoardId).sort((a, b) => a.order - b.order);
    if (boardStages.length > 0) {
      addCard(activeBoardId!, boardStages[0].id, fields);
    }
  };

  if (isProcessing) {
    return (
      <div style={{
        position: 'fixed', bottom: '24px', right: '24px',
        background: 'var(--surface-1)', backdropFilter: 'blur(10px)',
        border: '1px solid var(--primary-glow)', borderRadius: 'var(--border-radius-md)',
        padding: '16px 24px', display: 'flex', alignItems: 'center', gap: '16px',
        boxShadow: 'var(--shadow-lg)', zIndex: 9999
      }}>
        <Loader2 className="spinner" size={24} color="var(--primary-color)" style={{ animation: 'spin 1s linear infinite' }} />
        <div>
          <h4 style={{ margin: 0, fontSize: '0.95rem', fontWeight: 600 }}>Scanning Screenshot...</h4>
          <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '4px' }}>
            {progress}% complete
          </div>
        </div>
        <style>{`
          @keyframes spin { 100% { transform: rotate(360deg); } }
        `}</style>
      </div>
    );
  }

  // Persistent manual scan button
  if (!activeBoardId) return null;

  return (
    <div style={{
      position: 'fixed', bottom: '24px', right: '24px', zIndex: 9998
    }}>
      <button 
        className="premium-btn primary"
        onClick={handleManualPasteTrigger}
        style={{
          boxShadow: 'var(--shadow-lg), 0 0 15px var(--primary-glow)',
          padding: '12px 20px',
          borderRadius: 'var(--border-radius-lg)',
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          fontWeight: 600
        }}
      >
        <span style={{ fontSize: '1.2rem' }}>📸</span> Scan Image (Paste)
      </button>
    </div>
  );

};
