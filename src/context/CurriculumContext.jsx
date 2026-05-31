import { createContext, useContext, useReducer, useEffect } from 'react'
import { saveCurriculum, getCurriculum, getAllCurricula, deleteCurriculum } from '../utils/storage'

const CurriculumContext = createContext(null)

const initialState = {
  curricula: [],
  activeCurriculumId: null,
}

function reducer(state, action) {
  switch (action.type) {
    case 'LOAD_ALL':
      return { ...state, curricula: action.curricula }

    case 'ADD_CURRICULUM':
      return { ...state, curricula: [...state.curricula, action.curriculum] }

    case 'DELETE_CURRICULUM':
      return {
        ...state,
        curricula: state.curricula.filter(c => c.id !== action.id),
        activeCurriculumId: state.activeCurriculumId === action.id ? null : state.activeCurriculumId,
      }

    case 'SET_ACTIVE':
      return { ...state, activeCurriculumId: action.id }

    case 'UPDATE_LESSON': {
      const curricula = state.curricula.map(c => {
        if (c.id !== action.curriculumId) return c
        return {
          ...c,
          lastVisitedAt: new Date().toISOString(),
          lessons: c.lessons.map(l =>
            l.id === action.lessonId ? { ...l, ...action.updates } : l
          ),
        }
      })
      return { ...state, curricula }
    }

    case 'COMPLETE_LESSON': {
      const curricula = state.curricula.map(c => {
        if (c.id !== action.curriculumId) return c
        const lessons = c.lessons.map(l => {
          if (l.id === action.lessonId) return { ...l, status: 'complete' }
          // Unlock the next lesson in order
          const completedLesson = c.lessons.find(x => x.id === action.lessonId)
          if (completedLesson && l.order === completedLesson.order + 1 && l.status === 'locked') {
            return { ...l, status: 'active' }
          }
          return l
        })
        return { ...c, lessons, lastVisitedAt: new Date().toISOString() }
      })
      return { ...state, curricula }
    }

    case 'SAVE_TUTOR_MESSAGE': {
      const curricula = state.curricula.map(c => {
        if (c.id !== action.curriculumId) return c
        return {
          ...c,
          lessons: c.lessons.map(l =>
            l.id === action.lessonId
              ? { ...l, tutorHistory: [...(l.tutorHistory || []), action.message] }
              : l
          ),
        }
      })
      return { ...state, curricula }
    }

    case 'SAVE_QUIZ_RESULT': {
      const curricula = state.curricula.map(c => {
        if (c.id !== action.curriculumId) return c
        return {
          ...c,
          lessons: c.lessons.map(l =>
            l.id === action.lessonId
              ? {
                  ...l,
                  quiz: {
                    ...l.quiz,
                    questions: action.questions,
                    userAnswers: action.userAnswers,
                    passed: action.passed,
                    attempts: (l.quiz?.attempts || 0) + 1,
                  },
                }
              : l
          ),
        }
      })
      return { ...state, curricula }
    }

    default:
      return state
  }
}

export function CurriculumProvider({ children }) {
  const [state, dispatch] = useReducer(reducer, initialState)

  // Load from localStorage on mount
  useEffect(() => {
    const curricula = getAllCurricula()
    dispatch({ type: 'LOAD_ALL', curricula })
  }, [])

  // Sync to localStorage whenever curricula change
  useEffect(() => {
    state.curricula.forEach(c => saveCurriculum(c))
  }, [state.curricula])

  // Wrap deleteCurriculum to also update localStorage index
  function handleDelete(id) {
    deleteCurriculum(id)
    dispatch({ type: 'DELETE_CURRICULUM', id })
  }

  return (
    <CurriculumContext.Provider value={{ state, dispatch, handleDelete }}>
      {children}
    </CurriculumContext.Provider>
  )
}

export function useCurriculum() {
  const ctx = useContext(CurriculumContext)
  if (!ctx) throw new Error('useCurriculum must be used within CurriculumProvider')
  return ctx
}
