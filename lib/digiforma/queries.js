export const GET_TRAINING_SESSIONS_LIGHT = `
  query GetTrainingSessionsLight($pagination: Pagination, $filters: TrainingSessionFilters) {
    trainingSessions(pagination: $pagination, filters: $filters) {
      id
      name
      code
      startDate
      endDate
      pipelineState
    }
  }
`;

export const GET_TRAINING_SESSION_DETAILS = `
  query GetTrainingSessionDetails($id: ID!) {
    trainingSession(id: $id) {
      id
      name
      code
      startDate
      endDate
      pipelineState
      trainingType
      type
      timezone

      trainees {
        id
        firstname
        lastname
        email
        phone
        status
      }

      trainingSessionSlots {
        id
        date
        startTime
        endTime

        signatures {
          signature
          type
          customerTrainee {
            id
            trainee {
              id
              firstname
              lastname
              email
              phone
            }
          }
        }

        customerTrainees {
          id
          attendanceProofUrl
          extranetUrl

          trainee {
            id
            firstname
            lastname
            email
            phone
          }

          signatures {
            signature
            type
          }
        }

        subsession {
          id
          name
        }
      }
    }
  }
`;
