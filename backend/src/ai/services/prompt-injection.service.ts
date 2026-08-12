const INJECTION_PATTERNS: RegExp[] = [
  // Attempts to override system/developer instructions
  /ignore\s+(all|any|the|previous|prior|above)\s+(instructions|rules|prompts)/i,
  /disregard\s+(all|any|the|previous|prior|above)\s+(instructions|rules|prompts)/i,
  /forget\s+(all|any|the|previous|prior|above)\s+(instructions|rules|prompts)/i,

  // Attempts to change the AI's role
  /you\s+are\s+now\s+(a|an)\s+/i,
  /act\s+as\s+(a|an)\s+/i,
  /pretend\s+(to\s+be|you\s+are)/i,
  /from\s+now\s+on\s+you\s+are/i,

  // Prompt/system extraction
  /show\s+(me\s+)?(your|the)\s+(system|developer)\s+(prompt|instructions)/i,
  /reveal\s+(your|the)\s+(system|developer)\s+(prompt|instructions)/i,
  /print\s+(your|the)\s+(system|developer)\s+(prompt|instructions)/i,
  /what\s+(is|are)\s+your\s+(system|developer)\s+(prompt|instructions)/i,

  // Instruction extraction / manipulation
  /repeat\s+(your|the)\s+(system|developer)\s+(prompt|instructions)/i,
  /output\s+(your|the)\s+(system|developer)\s+(prompt|instructions)/i,

  // Fake system/developer messages
  /^\s*(system|developer|assistant)\s*:/im,

  // Common delimiter attacks
  /<\s*system\s*>/i,
  /<\s*developer\s*>/i,
  /\[\s*system\s*\]/i,
  /\[\s*developer\s*\]/i,

  // Tool/function manipulation
  /ignore\s+tool\s+(restrictions|rules)/i,
  /bypass\s+(tool|security|safety)\s+(restrictions|rules)/i,
];

const MAX_AI_MESSAGE_LENGTH = 10_000;

export interface PromptInjectionResult {
  detected: boolean;
  reason?: string;
}

export const getPromptInjectionResponse = (): string => {
  return "I cannot process that request because it contains instructions that conflicts with my ethics and settings. Please Ask anything else, from travel planning to hotel booking and itenary planning."
}

export const detectPromptInjection = (
  message: string,
): PromptInjectionResult => {
  const normalized = message.normalize("NFKC").replace(/\s+/g, " ").trim();

  if (!normalized) {
    return {
      detected: false,
    };
  }

  if(normalized.length > MAX_AI_MESSAGE_LENGTH) {
    return {
        detected: true,
        reason: "Message exceeds the allowed AI message length"
    }
  }

  for (const pattern of INJECTION_PATTERNS) {
    if (pattern.test(normalized)) {
      return {
        detected: true,
        reason: "Potential prompt injection detected",
      };
    }
  }

  return {
    detected: false,
  };
};
