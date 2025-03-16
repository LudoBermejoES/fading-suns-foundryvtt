import { getEffectsByType, createActiveEffectFromPredefined } from "../helpers/effects.mjs";
import effectsList, { EFFECT_TYPES } from "../activeeffects/activeEffects.js";

/**
 * A dialog for selecting predefined effects
 */
export class PredefinedEffectsDialog extends FormApplication {
  constructor(parent, options = {}) {
    super({}, options);
    this.parent = parent;
    this.selectedType = EFFECT_TYPES.PHYSICAL;
    this.effects = getEffectsByType(this.selectedType);
  }

  /** @override */
  static get defaultOptions() {
    return mergeObject(super.defaultOptions, {
      id: "predefined-effects-dialog",
      title: game.i18n.localize("FADING_SUNS.Effect.SelectPredefinedEffect"),
      template: "systems/fading-suns/templates/dialogs/predefined-effects.hbs",
      width: 600,
      height: "auto",
      classes: ["fading-suns", "predefined-effects-dialog"],
      submitOnChange: false,
      closeOnSubmit: false
    });
  }

  /** @override */
  getData() {
    return {
      effects: this.effects
    };
  }

  /** @override */
  activateListeners(html) {
    super.activateListeners(html);

    // Handle effect type selection
    html.find(".effect-type-btn").click(this._onEffectTypeSelect.bind(this));

    // Handle effect selection
    html.find(".effect-item").click(this._onEffectSelect.bind(this));
  }

  /**
   * Handle effect type selection
   * @param {Event} event - The click event
   * @private
   */
  _onEffectTypeSelect(event) {
    event.preventDefault();
    const type = event.currentTarget.dataset.type;
    
    // Update selected type and effects list
    this.selectedType = type;
    this.effects = getEffectsByType(type);
    
    // Update UI
    const html = this.element;
    html.find(".effect-type-btn").removeClass("active");
    event.currentTarget.classList.add("active");
    
    // Re-render the effects list
    this.render(true);
  }

  /**
   * Handle effect selection
   * @param {Event} event - The click event
   * @private
   */
  async _onEffectSelect(event) {
    event.preventDefault();
    const effectTitle = event.currentTarget.dataset.effectTitle;
    const effect = effectsList.find(e => e.title === effectTitle);
    
    if (effect) {
      // Create the active effect
      await createActiveEffectFromPredefined(effect, this.parent);
      
      // Close the dialog
      this.close();
    }
  }
} 