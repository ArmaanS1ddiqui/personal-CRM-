import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { v4 as uuidv4 } from 'uuid';

export type CustomField = {
  id: string;
  name: string;
  value: string;
};

export type CardHistoryEntry = {
  stageId: string;
  timestamp: string;
};

export type Card = {
  id: string;
  stageId: string;
  boardId: string;
  fields: CustomField[];
  history: CardHistoryEntry[];
};

export type Stage = {
  id: string;
  boardId: string;
  name: string;
  order: number;
};

export type Board = {
  id: string;
  name: string;
  formFields?: string[];
};

interface BoardState {
  boards: Board[];
  stages: Stage[];
  cards: Card[];
  activeBoardId: string | null;

  // Actions
  setActiveBoard: (id: string | null) => void;
  addBoard: (name: string) => void;
  updateBoard: (id: string, name: string) => void;
  deleteBoard: (id: string) => void;
  updateBoardForm: (id: string, formFields: string[]) => void;
  
  addStage: (boardId: string, name: string) => void;
  updateStages: (boardId: string, stages: Stage[]) => void;
  
  addCard: (boardId: string, stageId: string, fields?: CustomField[]) => void;
  updateCardFields: (cardId: string, fields: CustomField[]) => void;
  moveCard: (cardId: string, newStageId: string) => void;
  deleteCard: (cardId: string) => void;
}

const DEFAULT_JOB_BOARD_ID = 'board-job-applications';

const initialStages: Stage[] = [
  { id: 'stage-1', boardId: DEFAULT_JOB_BOARD_ID, name: 'To Apply', order: 0 },
  { id: 'stage-2', boardId: DEFAULT_JOB_BOARD_ID, name: 'Applied', order: 1 },
  { id: 'stage-3', boardId: DEFAULT_JOB_BOARD_ID, name: 'Interview', order: 2 },
  { id: 'stage-4', boardId: DEFAULT_JOB_BOARD_ID, name: 'Offer / Rejected', order: 3 },
];

export const useStore = create<BoardState>()(
  persist(
    (set) => ({
      boards: [
        { id: DEFAULT_JOB_BOARD_ID, name: 'Job Applications' }
      ],
      stages: initialStages,
      cards: [
        {
          id: 'card-1',
          boardId: DEFAULT_JOB_BOARD_ID,
          stageId: 'stage-1',
          fields: [
            { id: uuidv4(), name: 'Company', value: 'Google' },
            { id: uuidv4(), name: 'Role', value: 'Software Engineer' },
            { id: uuidv4(), name: 'Status', value: 'Ready to Apply' }
          ],
          history: [
            { stageId: 'stage-1', timestamp: new Date().toISOString() }
          ]
        }
      ],
      activeBoardId: DEFAULT_JOB_BOARD_ID,

      setActiveBoard: (id) => set({ activeBoardId: id }),

      addBoard: (name) => {
        const newBoardId = uuidv4();
        set((state) => ({
          boards: [...state.boards, { id: newBoardId, name }],
          activeBoardId: newBoardId,
          // Add default stages for a new board
          stages: [
            ...state.stages,
            { id: uuidv4(), boardId: newBoardId, name: 'To Do', order: 0 },
            { id: uuidv4(), boardId: newBoardId, name: 'In Progress', order: 1 },
            { id: uuidv4(), boardId: newBoardId, name: 'Done', order: 2 },
          ]
        }));
      },

      updateBoard: (id, name) => set((state) => ({
        boards: state.boards.map(b => b.id === id ? { ...b, name } : b)
      })),

      deleteBoard: (id) => set((state) => {
        const remainingBoards = state.boards.filter(b => b.id !== id);
        return {
          boards: remainingBoards,
          stages: state.stages.filter(s => s.boardId !== id),
          cards: state.cards.filter(c => c.boardId !== id),
          activeBoardId: state.activeBoardId === id 
            ? (remainingBoards.length > 0 ? remainingBoards[0].id : null) 
            : state.activeBoardId
        };
      }),

      updateBoardForm: (id, formFields) => set((state) => ({
        boards: state.boards.map(b => b.id === id ? { ...b, formFields } : b)
      })),

      addStage: (boardId, name) => set((state) => ({
        stages: [
          ...state.stages,
          { id: uuidv4(), boardId, name, order: state.stages.filter(s => s.boardId === boardId).length }
        ]
      })),

      updateStages: (boardId, newStages) => set((state) => {
        // Remove old stages for this board, add the new ones
        const otherStages = state.stages.filter(s => s.boardId !== boardId);
        return {
          stages: [...otherStages, ...newStages]
        };
      }),

      addCard: (boardId, stageId, fields) => set((state) => {
        const board = state.boards.find(b => b.id === boardId);
        let updatedFields = fields || [];
        
        // If no fields provided and board has a form template, initialize with it
        if (!fields || fields.length === 0) {
          if (board?.formFields && board.formFields.length > 0) {
            updatedFields = board.formFields.map(fieldName => ({
              id: uuidv4(),
              name: fieldName,
              value: ''
            }));
          } else {
            updatedFields = [{ id: uuidv4(), name: 'Title', value: 'New Card' }];
          }
        }

        return {
          cards: [
            ...state.cards,
            {
              id: uuidv4(),
              boardId,
              stageId,
              fields: updatedFields,
              history: [
                { stageId, timestamp: new Date().toISOString() }
              ]
            }
          ]
        };
      }),

      updateCardFields: (cardId, fields) => set((state) => ({
        cards: state.cards.map(card => 
          card.id === cardId ? { ...card, fields } : card
        )
      })),

      moveCard: (cardId, newStageId) => set((state) => ({
        cards: state.cards.map(card =>
          card.id === cardId ? { 
            ...card, 
            stageId: newStageId,
            history: [
              ...(card.history || []),
              { stageId: newStageId, timestamp: new Date().toISOString() }
            ]
          } : card
        )
      })),

      deleteCard: (cardId) => set((state) => ({
        cards: state.cards.filter(c => c.id !== cardId)
      })),
    }),
    {
      name: 'kanban-storage',
    }
  )
);
