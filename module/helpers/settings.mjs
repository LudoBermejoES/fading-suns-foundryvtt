/**
 * Register system settings
 */
export function registerSystemSettings() {
  // Register system settings here
  game.settings.register("fading-suns", "victoryPointsLimit", {
    name: "SETTINGS.VictoryPointsLimit",
    hint: "SETTINGS.VictoryPointsLimitHint",
    scope: "world",
    config: true,
    type: Number,
    default: 10,
    onChange: value => {
      console.log(`Victory Points limit changed to ${value}`);
    }
  });

  // Example of a client-side setting
  game.settings.register("fading-suns", "showEffectDetails", {
    name: "SETTINGS.ShowEffectDetails",
    hint: "SETTINGS.ShowEffectDetailsHint",
    scope: "client",
    config: true,
    type: Boolean,
    default: true
  });

  console.log("Fading Suns | System Settings Registered");
} 