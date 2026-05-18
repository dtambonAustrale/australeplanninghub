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
        phoneSecondary
        status
      }

      trainingSessionSlots {
        id
        date
        startTime
        endTime
        slot

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
              phoneSecondary
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
            phoneSecondary
          }

          signatures {
            signature
            type
            dates {
              id
              date
              startTime
              endTime
            }
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
