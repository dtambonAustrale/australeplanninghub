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

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

// HTTP status codes that are transient and worth retrying
const RETRYABLE_STATUS = new Set([429, 502, 503, 504]);
// Axios error codes that are transient
const RETRYABLE_CODES = new Set(['ECONNRESET', 'ETIMEDOUT', 'ECONNABORTED', 'ERR_NETWORK']);

function isRetryable(err) {
  if (err?.response?.status && RETRYABLE_STATUS.has(err.response.status)) return true;
  if (err?.code && RETRYABLE_CODES.has(err.code)) return true;
  return false;
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
 * Wraps digiformaGraphQLRequest with retry + exponential backoff.
 * Retries up to maxRetries times on transient errors (503, 502, 429, network).
 * Delays: 2s → 4s → 8s
 */
async function digiformaRequestWithRetry(query, variables = {}, maxRetries = 3) {
  let lastError;
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await digiformaGraphQLRequest(query, variables);
    } catch (err) {
      lastError = err;

      const status = err?.response?.status;
      const retryable = isRetryable(err);

      if (!retryable || attempt === maxRetries) {
        const label = status ? `HTTP ${status}` : err.code || err.message;
        throw new Error(`Digiforma request failed (${label}) after ${attempt + 1} attempt(s): ${err.message}`);
      }

      const delay = Math.pow(2, attempt + 1) * 1000; // 2s, 4s, 8s
      console.warn(`[Digiforma] Attempt ${attempt + 1} failed (${status || err.code}), retrying in ${delay / 1000}s…`);
      await sleep(delay);
    }
  }
  throw lastError;
}

/**
 * Test Digiforma API connectivity
 */
export async function testDigiformaConnection() {
  const data = await digiformaRequestWithRetry(GET_TRAINING_SESSIONS_LIGHT, {
    pagination: { page: 1, size: 1 },
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
    const data = await digiformaRequestWithRetry(GET_TRAINING_SESSIONS_LIGHT, {
      pagination: { page: page, size: PAGE_SIZE },
      filters,
    });

    const sessions = data?.trainingSessions || [];
    allSessions.push(...sessions);

    if (sessions.length < PAGE_SIZE || allSessions.length >= maxSessions || page >= MAX_PAGES) {
      break;
    }

    page++;

    // Small pause between pagination calls to avoid rate limiting
    await sleep(300);
  }

  return allSessions.slice(0, maxSessions);
}

/**
 * Fetch full details for a single training session (with retry)
 */
export async function fetchTrainingSessionDetails(sessionId) {
  const data = await digiformaRequestWithRetry(GET_TRAINING_SESSION_DETAILS, {
    id: sessionId,
  });

  return data?.trainingSession || null;
}
