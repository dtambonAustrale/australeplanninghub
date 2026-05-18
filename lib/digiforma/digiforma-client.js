import axios from 'axios';
import { GET_TRAINING_SESSIONS_LIGHT, GET_TRAINING_SESSION_DETAILS } from './queries.js';

const DIGIFORMA_API_URL = process.env.DIGIFORMA_API_URL || 'https://app.digiforma.com/api/v1/graphql';
const DIGIFORMA_API_TOKEN = process.env.DIGIFORMA_API_TOKEN;
const REQUEST_TIMEOUT = parseInt(process.env.DIGIFORMA_REQUEST_TIMEOUT || '45000', 10);
const PAGE_SIZE = parseInt(process.env.DIGIFORMA_PAGE_SIZE || '10', 10);
const MAX_PAGES = parseInt(process.env.DIGIFORMA_MAX_PAGES || '20', 10);

if (!DIGIFORMA_API_TOKEN) {
  console.warn('[Digiforma] DIGIFORMA_API_TOKEN is not set. API calls will fail.');
}

/**
 * Execute a GraphQL request against Digiforma API
 */
export async function digiformaGraphQLRequest(query, variables = {}) {
  const response = await axios.post(
    DIGIFORMA_API_URL,
    { query, variables },
    {
      timeout: REQUEST_TIMEOUT,
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${DIGIFORMA_API_TOKEN}`,
      },
    }
  );

  if (response.data.errors && response.data.errors.length > 0) {
    const messages = response.data.errors.map((e) => e.message).join('; ');
    throw new Error(`Digiforma GraphQL errors: ${messages}`);
  }

  return response.data.data;
}

/**
 * Test Digiforma API connectivity
 */
export async function testDigiformaConnection() {
  const data = await digiformaGraphQLRequest(GET_TRAINING_SESSIONS_LIGHT, {
    pagination: { page: 1, perPage: 1 },
    filters: {
      startedBefore: '2099-12-31',
      endedAfter: '2000-01-01',
    },
  });

  return {
    success: true,
    sessionCount: data?.trainingSessions?.length ?? 0,
  };
}

/**
 * Fetch all training sessions (light) for a given year using pagination
 */
export async function fetchTrainingSessionsLight(options = {}) {
  const targetYear = options.targetYear || parseInt(process.env.DIGIFORMA_TARGET_YEAR || '2026', 10);
  const maxSessions = options.maxSessions || MAX_PAGES * PAGE_SIZE;

  const filters = {
    startedBefore: `${targetYear}-12-31`,
    endedAfter: `${targetYear}-01-01`,
  };

  const allSessions = [];
  let page = 1;

  while (true) {
    const data = await digiformaGraphQLRequest(GET_TRAINING_SESSIONS_LIGHT, {
      pagination: { page, perPage: PAGE_SIZE },
      filters,
    });

    const sessions = data?.trainingSessions || [];
    allSessions.push(...sessions);

    if (sessions.length < PAGE_SIZE || allSessions.length >= maxSessions || page >= MAX_PAGES) {
      break;
    }

    page++;
  }

  return allSessions.slice(0, maxSessions);
}

/**
 * Fetch full details for a single training session
 */
export async function fetchTrainingSessionDetails(sessionId) {
  const data = await digiformaGraphQLRequest(GET_TRAINING_SESSION_DETAILS, {
    id: sessionId,
  });

  return data?.trainingSession || null;
}
