/**
 * 🔱 RANKCRACKERS CAREER SIGNAL REDUCER ENGINE
 * Gate 48CS2R2 — Official-Rule-Safe Pure Event Reducer
 *
 * Implements deterministic lifecycle state reduction:
 *   - Canonical 12-state state machine
 *   - FINAL_RESULT_DECLARED is an active process event (processUpdateSignalActive = true)
 *   - Only CYCLE_CLOSED definitively terminates the cycle (processUpdateSignalActive = false)
 *   - Zero arbitrary 7-day expiration
 */

'use strict';

const {
  CANONICAL_RECRUITMENT_CYCLE_STATUS,
  CAREER_SIGNAL_EVENT_TYPE,
  normalizeCycleStatus,
  normalizeRecruitmentCycle,
  normalizeCareerSignalEvent
} = require('./career_signal_models');

/**
 * Computes whether opportunity signal or process update signal is active.
 *
 * Canonical Rules:
 *   - ANNOUNCED / APPLICATION_OPEN: Opportunity signal active (subject to deadline)
 *   - EXAM_SCHEDULED ... FINAL_RESULT_DECLARED: Process update signal active
 *   - CYCLE_CLOSED / CANCELLED: Both inactive (cycle definitively ended)
 */
function computeActiveSignalFlags(status, applicationEndDate, nowIso) {
  const now = new Date(nowIso || new Date().toISOString());
  const canonicalStatus = normalizeCycleStatus(status);

  let opportunitySignalActive = false;
  let processUpdateSignalActive = false;

  switch (canonicalStatus) {
    case CANONICAL_RECRUITMENT_CYCLE_STATUS.APPLICATION_OPEN: {
      if (applicationEndDate) {
        const deadline = new Date(applicationEndDate);
        opportunitySignalActive = now <= deadline;
      } else {
        opportunitySignalActive = true;
      }
      processUpdateSignalActive = false;
      break;
    }

    case CANONICAL_RECRUITMENT_CYCLE_STATUS.ANNOUNCED: {
      opportunitySignalActive = true;
      processUpdateSignalActive = false;
      break;
    }

    case CANONICAL_RECRUITMENT_CYCLE_STATUS.APPLICATION_CLOSED:
    case CANONICAL_RECRUITMENT_CYCLE_STATUS.EXAM_SCHEDULED:
    case CANONICAL_RECRUITMENT_CYCLE_STATUS.EXAM_COMPLETED:
    case CANONICAL_RECRUITMENT_CYCLE_STATUS.ANSWER_KEY_STAGE:
    case CANONICAL_RECRUITMENT_CYCLE_STATUS.RESULT_STAGE:
    case CANONICAL_RECRUITMENT_CYCLE_STATUS.INTERVIEW_OR_DV_STAGE:
    case CANONICAL_RECRUITMENT_CYCLE_STATUS.FINAL_RESULT_DECLARED: {
      // FINAL_RESULT_DECLARED is an official process event that remains visible to students!
      opportunitySignalActive = false;
      processUpdateSignalActive = true;
      break;
    }

    case CANONICAL_RECRUITMENT_CYCLE_STATUS.CYCLE_CLOSED:
    case CANONICAL_RECRUITMENT_CYCLE_STATUS.CANCELLED: {
      // Only CYCLE_CLOSED or CANCELLED definitively terminates the process
      opportunitySignalActive = false;
      processUpdateSignalActive = false;
      break;
    }

    case CANONICAL_RECRUITMENT_CYCLE_STATUS.STATUS_UNRESOLVED:
    default: {
      opportunitySignalActive = false;
      processUpdateSignalActive = false;
      break;
    }
  }

  return {
    opportunitySignalActive,
    processUpdateSignalActive
  };
}

/**
 * Pure reducer function reducing a sequence of verified events onto a RecruitmentCycle.
 */
function reduceEventsToEffectiveState(initialCycle, events = [], options = {}) {
  const currentCycle = normalizeRecruitmentCycle(initialCycle);
  const nowIso = options.nowIso || new Date().toISOString();

  const sortedEvents = events
    .map(e => normalizeCareerSignalEvent(e))
    .sort((a, b) => {
      const timeA = new Date(a.effectiveDate || a.emittedAt).getTime();
      const timeB = new Date(b.effectiveDate || b.emittedAt).getTime();
      if (timeA !== timeB) return timeA - timeB;
      return a.eventId.localeCompare(b.eventId);
    });

  let effectiveStatus = currentCycle.status;
  let currentWindow = {
    ...currentCycle.applicationWindow,
    extensionHistory: [...currentCycle.applicationWindow.extensionHistory]
  };
  let currentExamDates = [...currentCycle.examDates];
  let currentVacancies = currentCycle.totalVacancies;
  const processedEventIds = [];

  for (const event of sortedEvents) {
    processedEventIds.push(event.eventId);

    switch (event.eventType) {
      case CAREER_SIGNAL_EVENT_TYPE.NEW_NOTIFICATION: {
        effectiveStatus = CANONICAL_RECRUITMENT_CYCLE_STATUS.APPLICATION_OPEN;

        if (event.payload.applicationStart) {
          currentWindow.startDate = event.payload.applicationStart;
        }
        if (event.payload.applicationEnd) {
          currentWindow.endDate = event.payload.applicationEnd;
        }
        if (event.payload.vacancies !== undefined) {
          currentVacancies = event.payload.vacancies;
        }
        if (event.payload.totalVacancies !== undefined) {
          currentVacancies = event.payload.totalVacancies;
        }
        if (event.payload.scheduledExamDate) {
          currentExamDates.push({
            stageName: event.payload.examStage || 'PRELIMS',
            scheduledDate: event.payload.scheduledExamDate,
            isTentative: false,
            announcementDocRef: event.documentProvenance.documentIdentity
          });
        }
        break;
      }

      case CAREER_SIGNAL_EVENT_TYPE.APPLICATION_DEADLINE_CHANGED: {
        const previousEndDate = currentWindow.endDate;
        const newEndDate = event.payload.applicationEnd || event.payload.extendedDeadline;
        if (newEndDate && newEndDate !== previousEndDate) {
          currentWindow.isExtended = true;
          currentWindow.endDate = newEndDate;
          currentWindow.extensionHistory.push({
            previousEndDate: previousEndDate || '',
            newEndDate: newEndDate,
            amendmentEventId: event.eventId,
            timestamp: event.emittedAt
          });
        }
        break;
      }

      case CAREER_SIGNAL_EVENT_TYPE.EXAM_DATE_ANNOUNCED: {
        effectiveStatus = CANONICAL_RECRUITMENT_CYCLE_STATUS.EXAM_SCHEDULED;
        if (event.payload.examDates && Array.isArray(event.payload.examDates)) {
          currentExamDates = event.payload.examDates;
        }
        break;
      }

      case 'EXAM_COMPLETED':
      case CAREER_SIGNAL_EVENT_TYPE.EXAM_COMPLETED: {
        effectiveStatus = CANONICAL_RECRUITMENT_CYCLE_STATUS.EXAM_COMPLETED;
        break;
      }

      case CAREER_SIGNAL_EVENT_TYPE.ANSWER_KEY_RELEASED: {
        effectiveStatus = CANONICAL_RECRUITMENT_CYCLE_STATUS.ANSWER_KEY_STAGE;
        break;
      }

      case CAREER_SIGNAL_EVENT_TYPE.RESULT_DECLARED: {
        effectiveStatus = CANONICAL_RECRUITMENT_CYCLE_STATUS.RESULT_STAGE;
        break;
      }

      case CAREER_SIGNAL_EVENT_TYPE.FINAL_RESULT_DECLARED: {
        if (event.payload && event.payload.cycleClosed === true) {
          effectiveStatus = CANONICAL_RECRUITMENT_CYCLE_STATUS.CYCLE_CLOSED;
        } else {
          effectiveStatus = CANONICAL_RECRUITMENT_CYCLE_STATUS.FINAL_RESULT_DECLARED;
        }
        break;
      }

      case 'CYCLE_CLOSED': {
        effectiveStatus = CANONICAL_RECRUITMENT_CYCLE_STATUS.CYCLE_CLOSED;
        break;
      }

      case CAREER_SIGNAL_EVENT_TYPE.RECRUITMENT_CANCELLED: {
        effectiveStatus = CANONICAL_RECRUITMENT_CYCLE_STATUS.CANCELLED;
        break;
      }

      case CAREER_SIGNAL_EVENT_TYPE.VACANCY_CHANGED:
      case CAREER_SIGNAL_EVENT_TYPE.CORRIGENDUM_OR_AMENDMENT: {
        if (event.payload.totalVacancies !== undefined) {
          currentVacancies = event.payload.totalVacancies;
        }
        break;
      }
    }
  }

  const { opportunitySignalActive, processUpdateSignalActive } = computeActiveSignalFlags(
    effectiveStatus,
    currentWindow.endDate,
    nowIso
  );

  return normalizeRecruitmentCycle({
    ...currentCycle,
    status: effectiveStatus,
    applicationWindow: currentWindow,
    examDates: currentExamDates,
    totalVacancies: currentVacancies,
    opportunitySignalActive,
    processUpdateSignalActive,
    updatedAt: nowIso
  });
}

module.exports = {
  computeActiveSignalFlags,
  reduceEventsToEffectiveState
};
