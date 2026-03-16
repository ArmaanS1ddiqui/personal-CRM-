import React, { useCallback, useEffect, useRef, useState } from "react";
import { useStore } from "../store/useStore";
import { v4 as uuidv4 } from "uuid";
import { Loader2 } from "lucide-react";

export const OCRScanner: React.FC = () => {
  const [isProcessing, setIsProcessing] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const statusTimeoutRef = useRef<number | null>(null);

  const activeBoardId = useStore((state) => state.activeBoardId);
  const boards = useStore((state) => state.boards);
  const stages = useStore((state) => state.stages);
  const addCard = useStore((state) => state.addCard);

  const getErrorMessage = (err: unknown): string => {
    if (err instanceof Error) return err.message;
    if (typeof err === "string") return err;
    return "An unknown error occurred";
  };

  const showStatus = useCallback((message: string) => {
    setStatusMessage(message);
    if (statusTimeoutRef.current) window.clearTimeout(statusTimeoutRef.current);
    statusTimeoutRef.current = window.setTimeout(
      () => setStatusMessage(null),
      3000,
    );
  }, []);

  const blobToBase64 = (blob: Blob): Promise<string> =>
    new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        const result = reader.result as string;
        resolve(result.split(",")[1]);
      };
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });

  const processImageWithGemini = useCallback(
    async (imageBlob: Blob) => {
      const boardId = activeBoardId;
      if (!boardId) return;

      const activeBoard = boards.find((b) => b.id === boardId);
      if (!activeBoard) return;

      const requestedFields =
        activeBoard.formFields && activeBoard.formFields.length > 0
          ? activeBoard.formFields
          : ["Company Name", "Job Role", "Source"];

      setIsProcessing(true);
      showStatus("Sending image to Gemini...");

      try {
        const base64Image = await blobToBase64(imageBlob);
        const mimeType = imageBlob.type || "image/png";

        console.log("📤 Sending to Gemini Vision...");
        console.log("MIME type:", mimeType);
        console.log("Base64 length:", base64Image.length);
        console.log("API Key present:", !!import.meta.env.VITE_GEMINI_API_KEY);

        const prompt = `
You are an AI assistant that extracts structured information from screenshots.

Extract the following fields from the image:
${requestedFields.map((f, i) => `${i + 1}. ${f}`).join("\n")}

Return ONLY a JSON object with no markdown, no code fences, no extra text.
Keys must exactly match the field names. Use "Unknown" if a field is not found.

Example:
{
  ${requestedFields.map((f) => `"${f}": "extracted value"`).join(",\n  ")}
}
        `;

        const requestBody = {
          contents: [
            {
              parts: [
                {
                  inline_data: {
                    mime_type: mimeType,
                    data: base64Image,
                  },
                },
                { text: prompt },
              ],
            },
          ],
          // ✅ No generationConfig needed
        };

        const response = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${import.meta.env.VITE_GEMINI_API_KEY}`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(requestBody),
          },
        );

        const data = await response.json();
        console.log("📥 Gemini raw response:", JSON.stringify(data, null, 2));

        if (!response.ok) {
          const errorMessage =
            (data as { error?: { message?: string } })?.error?.message ||
            `HTTP ${response.status} ${response.statusText}`;
          console.error(
            "❌ Gemini API error details:",
            (data as { error?: unknown })?.error,
          );
          throw new Error(errorMessage);
        }

        showStatus("Gemini responded — creating card.");

        const jsonText = (
          data as {
            candidates?: { content?: { parts?: { text?: string }[] } }[];
          }
        )?.candidates?.[0]?.content?.parts?.[0]?.text;

        console.log("📝 Extracted JSON text:", jsonText);

        let parsedResult: Record<string, string> = {};
        if (typeof jsonText === "string") {
          try {
            parsedResult = JSON.parse(jsonText) as Record<string, string>;
            console.log("✅ Parsed result:", parsedResult);
          } catch (parseErr) {
            console.error("❌ JSON parse failed:", parseErr);
            console.error("Raw text was:", jsonText);
          }
        } else {
          console.warn(
            "⚠️ No text in Gemini response. Full candidates:",
            (data as { candidates?: unknown })?.candidates,
          );
        }

        const fields = requestedFields.map((fieldName) => ({
          id: uuidv4(),
          name: fieldName,
          value: parsedResult[fieldName] || "Unknown",
        }));

        const boardStages = stages
          .filter((s) => s.boardId === boardId)
          .sort((a, b) => a.order - b.order);

        if (boardStages.length > 0) {
          addCard(boardId, boardStages[0].id, fields);
          showStatus("✅ Card created!");
          console.log(
            "✅ Card added to board:",
            boardId,
            "stage:",
            boardStages[0].id,
          );
        } else {
          console.warn("⚠️ No stages found for board:", boardId);
        }
      } catch (err) {
        const message = getErrorMessage(err);
        console.error("❌ Gemini Vision failed:", err);
        showStatus("❌ Failed to process image.");
        alert(
          `Gemini Vision failed:\n\n${message}\n\nCheck the browser console (F12) for full details.`,
        );
      } finally {
        setIsProcessing(false);
      }
    },
    [activeBoardId, boards, stages, addCard, showStatus],
  );

  useEffect(() => {
    const handlePaste = async (e: ClipboardEvent) => {
      const items = e.clipboardData?.items;
      if (!items || !activeBoardId) return;

      for (const item of items) {
        if (item.type.startsWith("image/")) {
          const blob = item.getAsFile();
          if (blob) {
            console.log("📋 Image pasted from clipboard, type:", item.type);
            await processImageWithGemini(blob);
          }
          return;
        }
      }

      console.log("📋 Paste event fired but no image found in clipboard.");
    };

    window.addEventListener("paste", handlePaste);
    return () => window.removeEventListener("paste", handlePaste);
  }, [activeBoardId, processImageWithGemini]);

  useEffect(() => {
    return () => {
      if (statusTimeoutRef.current)
        window.clearTimeout(statusTimeoutRef.current);
    };
  }, []);

  const handleManualPasteTrigger = useCallback(async () => {
    if (!activeBoardId) return;
    if (!navigator.clipboard?.read) {
      alert(
        "Clipboard read not supported in this browser. Use Ctrl+V / Cmd+V to paste.",
      );
      return;
    }

    try {
      console.log("📋 Reading clipboard via navigator.clipboard.read()...");
      const items = await navigator.clipboard.read();
      console.log(
        "📋 Clipboard item types:",
        items.map((i) => i.types),
      );

      for (const item of items) {
        const imageType = item.types.find((t) => t.startsWith("image/"));
        if (!imageType) continue;

        const blob = await item.getType(imageType);
        console.log(
          "📋 Found image in clipboard:",
          imageType,
          "size:",
          blob.size,
        );
        await processImageWithGemini(blob);
        return;
      }

      alert("No image found in clipboard. Copy a screenshot first.");
    } catch (err) {
      const message = getErrorMessage(err);
      console.error("❌ Clipboard read failed:", err);
      alert(
        `Unable to read clipboard: ${message}. Try Ctrl+V / Cmd+V instead.`,
      );
    }
  }, [activeBoardId, processImageWithGemini]);

  if (!activeBoardId) return null;

  return (
    <>
      {isProcessing && (
        <div
          style={{
            position: "fixed",
            bottom: "80px",
            right: "24px",
            background: "var(--surface-1)",
            backdropFilter: "blur(10px)",
            border: "1px solid var(--primary-glow)",
            borderRadius: "var(--border-radius-md)",
            padding: "16px 24px",
            display: "flex",
            alignItems: "center",
            gap: "16px",
            boxShadow: "var(--shadow-lg)",
            zIndex: 9999,
          }}
        >
          <Loader2
            size={24}
            color="var(--primary-color)"
            style={{ animation: "spin 1s linear infinite" }}
          />
          <div>
            <h4 style={{ margin: 0, fontSize: "0.95rem", fontWeight: 600 }}>
              Sending to Gemini Vision...
            </h4>
            {statusMessage && (
              <div
                style={{
                  fontSize: "0.8rem",
                  color: "var(--text-muted)",
                  marginTop: "4px",
                }}
              >
                {statusMessage}
              </div>
            )}
          </div>
          <style>{`@keyframes spin { 100% { transform: rotate(360deg); } }`}</style>
        </div>
      )}

      <div
        style={{
          position: "fixed",
          bottom: "24px",
          right: "24px",
          zIndex: 9998,
        }}
      >
        <button
          className="premium-btn primary"
          onClick={handleManualPasteTrigger}
          style={{
            boxShadow: "var(--shadow-lg), 0 0 15px var(--primary-glow)",
            padding: "12px 20px",
            borderRadius: "var(--border-radius-lg)",
            display: "flex",
            alignItems: "center",
            gap: "8px",
            fontWeight: 600,
          }}
        >
          <span style={{ fontSize: "1.2rem" }}>📸</span> Scan Image (Paste)
        </button>
      </div>
    </>
  );
};
