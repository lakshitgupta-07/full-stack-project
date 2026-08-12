import { retry } from "../utils/apiRetry.js";

let attempts = 0;

const result = await retry(
  async () => {
    attempts++;

    console.log(`Attempt ${attempts}`);

    if (attempts < 5) {
      throw new Error("Simulated Gemini failure");
    }

    return "Success!";
  },
  {
    retries: 2,
    delay: 1000,
  }
);

console.log("Result:", result);
console.log("Total attempts:", attempts);