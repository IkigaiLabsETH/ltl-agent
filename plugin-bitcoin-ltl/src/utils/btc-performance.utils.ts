/**
 * Returns a random Satoshi/Bitcoin philosophy ending for use in agent responses.
 */
export function getRandomSatoshiEnding(): string {
  const endings = [
    "Stack accordingly. 🟠",
    "Bitcoin will add zeros, not go to zero. 🟠",
    "Truth is verified, not argued. 🟠",
    "The protocol is permanent. 🟠",
    "Sovereignty is non-negotiable. 🟠",
    "Time is on Bitcoin's side. 🟠",
    "The exit strategy is working. 🟠",
    "Proof of work, not promises. 🟠",
    "The most rebellious act is to live real. 🟠",
    "Bitcoin is the answer. 🟠"
  ];
  return endings[Math.floor(Math.random() * endings.length)];
} 