/**
 * Map a Digiforma light session to our DB format
 */
export function mapSessionLight(raw) {
  return {
    id: String(raw.id),
    name: raw.name || null,
    code: raw.code || null,
    start_date: raw.startDate || null,
    end_date: raw.endDate || null,
    pipeline_state: raw.pipelineState || null,
    training_type: null,
    type: null,
    timezone: null,
  };
}

/**
 * Map a Digiforma full session to our DB format
 */
export function mapSessionFull(raw) {
  return {
    id: String(raw.id),
    name: raw.name || null,
    code: raw.code || null,
    start_date: raw.startDate || null,
    end_date: raw.endDate || null,
    pipeline_state: raw.pipelineState || null,
    training_type: raw.trainingType || null,
    type: raw.type || null,
    timezone: raw.timezone || null,
  };
}

/**
 * Map a Digiforma trainee to our DB format
 */
export function mapTrainee(raw) {
  const fullName = [raw.firstname, raw.lastname].filter(Boolean).join(' ').trim();
  return {
    id: String(raw.id),
    firstname: raw.firstname || null,
    lastname: raw.lastname || null,
    full_name: fullName || null,
    email: raw.email || null,
    phone: raw.phone || null,
    phone_secondary: raw.phoneSecondary || null,
    status: raw.status || null,
  };
}

/**
 * Map a Digiforma slot to our DB format
 */
export function mapSlot(raw, sessionId) {
  return {
    id: String(raw.id),
    session_id: String(sessionId),
    slot_date: raw.date || null,
    start_time: raw.startTime || null,
    end_time: raw.endTime || null,
    slot_label: raw.slot || null,
    subsession_id: raw.subsession?.id ? String(raw.subsession.id) : null,
    subsession_name: raw.subsession?.name || null,
  };
}

/**
 * Check if a signature is valid (non-empty)
 */
export function isValidSignature(sig) {
  return sig && sig.signature && sig.signature.trim().length > 0;
}

/**
 * Extract all trainee IDs that have signed for a given slot
 */
export function getSignedTraineeIds(slot) {
  const signed = new Set();

  // Check slot-level signatures
  if (Array.isArray(slot.signatures)) {
    for (const sig of slot.signatures) {
      if (isValidSignature(sig) && sig.customerTrainee?.trainee?.id) {
        signed.add(String(sig.customerTrainee.trainee.id));
      }
    }
  }

  // Check customerTrainee-level signatures
  if (Array.isArray(slot.customerTrainees)) {
    for (const ct of slot.customerTrainees) {
      if (ct.trainee?.id && Array.isArray(ct.signatures)) {
        for (const sig of ct.signatures) {
          if (isValidSignature(sig)) {
            signed.add(String(ct.trainee.id));
          }
        }
      }
    }
  }

  return signed;
}
