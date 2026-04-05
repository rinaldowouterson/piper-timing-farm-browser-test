/**
 * Test Battery for Piper Timing Farm
 * 
 * Curated sentences for "Asshole-Proof" verification.
 * Emphasis on length (hotswap window) and stress-testing.
 */

// Generating 100 long sentences for massive load verificationing
export const TEST_BATTERY = {
  LONG_PARAGRAPHS_EN: Array.from({ length: 100 }, (_, i) => 
    `[#${i + 1}] The industrial revolution was a major turning point in history, transforming the way people lived and worked through the introduction of machinery and new manufacturing processes. It began in Great Britain in the late eighteenth century and eventually spread to other parts of the world, leading to profound economic, social, and cultural changes that still resonate today.`
  ),
  LONG_PARAGRAPHS_UK: Array.from({ length: 100 }, (_, i) => 
    `[#${i + 1}] Промислова революція стала важливим поворотним моментом в історії, змінивши спосіб життя та праці людей завдяки впровадженню машин та нових виробничих процесів. Вона розпочалася у Великобританії наприкінці вісімнадцятого століття і зрештою поширилася на інші частини світу, призвівши до глибоких економічних, соціальних та культурних змін.`
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
  },
  STRESS_BARRAGE: [
    ...TEST_BATTERY.QUICK_PHRASES,
    TEST_BATTERY.LONG_PARAGRAPHS_EN[0],
    ...TEST_BATTERY.QUICK_PHRASES,
    TEST_BATTERY.LONG_PARAGRAPHS_UK[0]
  ]
};
