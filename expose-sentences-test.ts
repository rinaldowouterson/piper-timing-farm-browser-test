/**
 * Test Battery for Piper Timing Farm
 * 
 * Curated sentences for "Asshole-Proof" verification.
 */

// Generating 100 uniform sentences for massive load verificationing
export const TEST_BATTERY = {
  UNIFORM_EN: Array.from({ length: 100 }, (_, i) => 
    `This is sentence number ${i + 1} and i will be speaking for a while.`
  ),
  LONG_PARAGRAPHS_UK: Array.from({ length: 10 }, (_, i) => 
    `[#${i + 1}] Промислова революція стала важливим поворотним моментом в історії, змінивши спосіб життя та праці людей завдяки впровадженню машин та нових виробничих процесів.`
  ),
  QUICK_PHRASES: [
    "Hello world.",
    "Quick test.",
    "Fifo works.",
    "Next model ready.",
    "Synthesis complete."
  ]
};

export const SCENARIOS = {
  HOTSWAP_EN_TO_UK: {
    start: "This is a very long introduction in English produced by the Bryce model. While I am speaking, you should trigger the transition to Ukrainian. The engine will download the new assets in the background, and as soon as it's ready, the next sentences will seamlessly switch to the Ukrainian model without any delay or stutter in the queue orchestration.",
    transition: "Тепер я розмовляю українською мовою. Як бачите, перехід відбувся плавно та автоматично, щойно модель була повністю завантажена та ініціалізована в пам'яті."
  }
};
