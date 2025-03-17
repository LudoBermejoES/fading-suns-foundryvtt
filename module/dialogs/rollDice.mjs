import { mergeObject } from '../helpers/utils.mjs';
import { parseAttackProperties, calculateEffectiveResistance, getResistanceLevel } from '../helpers/combat.mjs';
import { getEffectModifiers, applyEffectModifiersToRoll, formatActiveEffectsForDisplay } from '../helpers/rollEffects.mjs';
import { 
  calculateRoll, 
  determineRollType, 
  calculateTargetResistance, 
  processRollResult, 
  calculateDamage, 
  hasRandomTarget, 
  calculateExtraVPCost, 
  canSpendVP 
} from '../helpers/rollCalculation.mjs';

/**
 * Define your class that extends FormApplication
 */
export default class RollDice extends FormApplication {
  constructor(actor, dataset) {
    super();
    this.actor = actor;
    this.dataset = dataset;
    this.characteristic = this.dataset.characteristic || this.characteristic;
    this.maneuver = this.dataset.maneuver || {};
    this.extraModifiers = this.dataset.modifier || this.extraModifiers;
    this.damage = this.dataset.damage;
    this.isWeapon = !!this.dataset.isWeapon;
    this.target = game?.user?.targets?.first?.() || null;
    this.attackProperties = [];
    this.coverage = "none"; // Default to no coverage
    this.disabledEffectIds = []; // Track effects that have been disabled via checkboxes
    
    // Defense-specific properties
    this.isDefense = !!this.dataset.isDefense;
    this.attackTotal = this.dataset.attackTotal ? parseInt(this.dataset.attackTotal) : 0;
    this.attackerId = this.dataset.attackerId;
    this.messageId = this.dataset.messageId;
    
    // If this is a weapon, parse attack properties from Features field
    if (this.isWeapon && this.dataset.itemId) {
      const item = this.actor.items.get(this.dataset.itemId);
      if (item && item.system.Features) {
        this.attackProperties = parseAttackProperties(item.system.Features);
      }
    }
    
    // Get effect modifiers
    this._updateEffectModifiers();
  }

  characteristic = "str";

  resistance = "Unknown";

  victoryPointsSelected = 0;

  wyrdPointUsed = false;

  extraModifiers = 0;

  maneuver = {};

  isWeapon = false;

  target = null;
  
  attackProperties = [];
  
  coverage = "none"; // none, partial, total
  
  disabledEffectIds = []; // Track effects that have been disabled via checkboxes

  /**
   * Update effect modifiers based on current state
   * @private
   */
  _updateEffectModifiers() {
    const rollData = {
      characteristic: this.characteristic,
      skill: this.dataset.value,
      maneuver: this.maneuver,
      isWeapon: this.isWeapon,
      attackProperties: this.attackProperties
    };
    
    this.effectModifiers = getEffectModifiers(this.actor, rollData, this.disabledEffectIds);
    this.activeEffects = formatActiveEffectsForDisplay(this.actor).map(effect => {
      // Mark effects as disabled if they are in the disabledEffectIds array
      return {
        ...effect,
        disabled: this.disabledEffectIds.includes(effect.id)
      };
    });
  }

  static get defaultOptions() {
    return mergeObject(super.defaultOptions, {
      classes: ["form"],
      popOut: true,
      template: "systems/fading-suns/templates/dialogs/roll.hbs",
      id: "RollDice",
      title: game.i18n.format(`FADING_SUNS.LETS_ROL`),
      width: 550,
    });
  }

  /**
   * Provide data to the template
   * @returns {Object} The data to be used in the template
   */
  getData() {
    return this.getCalculatedData();
  }

  getCalculatedData() {
    // Only initialize numericResistance for weapon rolls with a target
    if (this.isWeapon && this.target) {
      this.numericResistance = 0;
    }
    
    const characteristics = this.actor.system.characteristics;

    const characteristicsTranslated = Object.keys(characteristics).map(
      (key) => ({
        key,
        value: characteristics[key],
        translated: game.i18n.format(`FADING_SUNS.CharacteristicLong.${key}`),
      }),
    );

    const resistances = {
      Unknown: "?",
      Effortless: "0",
      Easy: "2",
      Hard: "4",
      Demanding: "6",
      Tough: "8",
      Severe: "10",
      Herculean: "12",
      Miraculous: "14",
    };

    // If this is a weapon roll and we have a target, calculate resistance based on attack properties and armor
    if (this.isWeapon && this.target) {
      const targetActor = this.target.actor;
      
      if (targetActor) {
        // Calculate target resistance using our helper function
        const attackData = {
          attackProperties: this.attackProperties,
          coverage: this.coverage
        };
        
        // Calculate the resistance
        let totalResistance = calculateTargetResistance(targetActor, attackData, this.actor);
        
        // Add coverage modifiers
        if (this.coverage === "partial") {
          totalResistance += 3;
        } else if (this.coverage === "total") {
          totalResistance += 6;
        }
        
        // Set resistance level based on calculated resistance
        this.resistance = getResistanceLevel(totalResistance);
        
        // Store the numeric resistance value for display
        this.numericResistance = totalResistance;
      }
    }

    const resistancesTranslated = Object.keys(resistances).map((key) => ({
      key,
      value: this.numericResistance || resistances[key],
      translated: game.i18n.format(`FADING_SUNS.ResistancesList.${key}`),
    }));

    const characteristicSelected = game.i18n.format(
      `FADING_SUNS.CharacteristicLong.${this.characteristic}`,
    );
    const characteristicValueSelected = characteristics[this.characteristic];
    const resistanceSelected = game.i18n.format(
      `FADING_SUNS.ResistancesList.${this.resistance}`,
    );
    const resistanceValueSelected = resistances[this.resistance];

    // Calculate total roll with effect modifiers
    const rollData = {
      characteristic: this.characteristic,
      skill: this.dataset.value,
      victoryPointsSelected: this.victoryPointsSelected,
      wyrdPointUsed: this.wyrdPointUsed,
      extraModifiers: Number(this.extraModifiers),
      maneuver: this.maneuver,
      isWeapon: this.isWeapon,
      attackProperties: this.attackProperties
    };
    
    // Apply effect modifiers
    const modifiedRollData = applyEffectModifiersToRoll(rollData, this.effectModifiers);
    
    // Get the skill value properly
    let skillValue = 0;
    if (typeof this.dataset.value === 'number' || !isNaN(Number(this.dataset.value))) {
      // If dataset.value is already a number, use it directly
      skillValue = Number(this.dataset.value);
    } else {
      // Otherwise try to get it from the actor's skills
      skillValue = Number(this.actor.system.skills[this.dataset.value]?.value || 0);
    }
    
    // Calculate total roll - use direct access for characteristic value
    const totalRoll =
      skillValue +
      Number(characteristics[this.characteristic]) +
      Number(this.victoryPointsSelected) +
      (this.wyrdPointUsed ? 3 : 0) +
      Number(this.extraModifiers) +
      (modifiedRollData.modifier || 0);

    console.log("Total Roll Calculation:", {
      skillValue,
      characteristic: this.characteristic,
      characteristicValue: Number(characteristics[this.characteristic]),
      victoryPoints: Number(this.victoryPointsSelected),
      wyrdPoints: this.wyrdPointUsed ? 3 : 0,
      extraModifiers: Number(this.extraModifiers),
      effectModifier: modifiedRollData.modifier || 0,
      totalRoll
    });

    // Get extra VP cost from effects
    const extraVPCost = calculateExtraVPCost(rollData, this.actor);

    // Add data to determine roll type for conditional display of modifiers
    const isPhysicalRoll = ['str', 'dex', 'end'].includes(this.characteristic);
    const isMentalRoll = ['int', 'wits', 'tec'].includes(this.characteristic);
    const isSocialRoll = ['pre', 'ego', 'pas'].includes(this.characteristic);
    const isPerceptionRoll = ['per'].includes(this.characteristic);

    return {
      actor: this.actor,
      resistancesTranslated,
      characteristicsTranslated,
      skillName: this.dataset.label,
      skillValue: this.dataset.value,
      skillTranslated: this.dataset.translated,
      characteristic: this.characteristic,
      resistance: this.resistance,
      characteristicSelected,
      characteristicValueSelected,
      maneuver: this.dataset.maneuver,
      resistanceSelected,
      resistanceValueSelected,
      victoryPoints: this.actor.system.bank.victoryPoints + 1,
      wyrdPoints: this.actor.system.bank.wyrdPoints,
      victoryPointsSelected: this.victoryPointsSelected,
      totalRoll,
      wyrdPointUsed: this.wyrdPointUsed,
      isWeapon: this.isWeapon,
      hasTarget: !!this.target,
      targetName: this.target?.name || "",
      attackProperties: this.attackProperties,
      coverage: this.coverage,
      numericResistance: this.numericResistance,
      effectModifiers: this.effectModifiers,
      activeEffects: this.activeEffects, // Add formatted active effects for display
      extraVPCost,
      canSpendVP: canSpendVP(this.actor),
      isPhysicalRoll,
      isMentalRoll,
      isSocialRoll,
      isPerceptionRoll
    };
  }

  activateListeners(html) {
    super.activateListeners(html);
    html
      .find('input[name="characteristic"]')
      .click(this._onClickCharacteristic.bind(this));
    html
      .find('input[name="resistance"]')
      .click(this._onClickResistance.bind(this));
    html
      .find('input[name="coverage"]')
      .click(this._onClickCoverage.bind(this));
    html
      .find('input[name="victoryPointsSelected"]')
      .click(this._onClickVictoryPoints.bind(this));
    html
      .find('input[name="wyrdPointUsed"]')
      .click(this._onClickWyrdPointUsed.bind(this));
    html.find('button[name="submit"]').click(this._onClickRollDice.bind(this));
    html
      .find('input[name="extraModifiers"]')
      .change(this._onChangeModifiers.bind(this));
      
    // Add listener for effect toggle checkboxes
    html
      .find('.effect-toggle')
      .change(this._onToggleEffect.bind(this));
  }

  async _updateObject(event, formData) {
    console.log(formData);
  }

  _onClickCharacteristic(event) {
    this.characteristic = event.currentTarget.value;
    this.render();
  }

  _onClickResistance(event) {
    this.resistance = event.currentTarget.value;
    this.render();
  }
  
  _onClickCoverage(event) {
    this.coverage = event.currentTarget.value;
    this.render();
  }

  _onClickVictoryPoints(event) {
    // Get the selected VP value
    const selectedVP = Number(event.currentTarget.value);
    
    // Get extra VP cost from effects
    const extraVPCost = calculateExtraVPCost({
      characteristic: this.characteristic,
      skill: this.dataset.value,
      maneuver: this.maneuver,
      isWeapon: this.isWeapon,
      attackProperties: this.attackProperties
    }, this.actor);
    
    // Set the total VP cost (selected + extra)
    this.victoryPointsSelected = selectedVP;
    
    // Check if the actor can spend VP
    if (!canSpendVP(this.actor)) {
      ui.notifications.warn(game.i18n.localize("FADING_SUNS.Warnings.CannotSpendVP"));
      this.victoryPointsSelected = 0;
    } else if (extraVPCost > 0) {
      ui.notifications.info(game.i18n.format("FADING_SUNS.Info.ExtraVPCost", { cost: extraVPCost }));
    }
    
    this.render();
  }
  _onClickWyrdPointUsed(event) {
    this.wyrdPointUsed = event.currentTarget.checked;
    this.render();
  }

  _onChangeModifiers(event) {
    this.extraModifiers = event.currentTarget.value;
    this.render();
  }

  _onToggleEffect(event) {
    const effectId = event.currentTarget.dataset.effectId;
    const isChecked = event.currentTarget.checked;
    
    if (!isChecked) {
      // Add to disabled effects if not checked
      if (!this.disabledEffectIds.includes(effectId)) {
        this.disabledEffectIds.push(effectId);
      }
    } else {
      // Remove from disabled effects if checked
      this.disabledEffectIds = this.disabledEffectIds.filter(id => id !== effectId);
    }
    
    // Update effect modifiers and re-render
    this._updateEffectModifiers();
    this.render();
  }

  _getMessage(success, critical, totalFailure, resistance, maneuver) {
    if (totalFailure)
      return game.i18n.format("FADING_SUNS.messages.TOTAL_FAILURE");
    if (!success) return game.i18n.format("FADING_SUNS.messages.FAILURE");
    if (critical) return game.i18n.format("FADING_SUNS.messages.CRITICAL");
    if (resistance < 0) return game.i18n.format("FADING_SUNS.messages.FAILURE");
    return game.i18n.format("FADING_SUNS.messages.SUCCESS");
  }

  _prepareRoll(dice, rollData, myRol) {
    // Apply effect modifiers to the roll data
    const modifiedRollData = applyEffectModifiersToRoll(rollData, this.effectModifiers);
    
    // Get the skill value (either directly from dataset value or from actor's skills)
    let skillValue = 0;
    if (typeof this.dataset.value === 'number' || !isNaN(Number(this.dataset.value))) {
      // If dataset.value is already a number, use it directly (defense rolls case)
      skillValue = Number(this.dataset.value);
    } else {
      // Otherwise try to get it from the actor's skills (normal rolls case)
      skillValue = Number(this.actor.system.skills[this.dataset.value]?.value || 0);
    }
    
    // Get the characteristic value - in the Fading Suns system, characteristics are direct values
    const characteristicValue = Number(this.actor.system.characteristics[this.characteristic] || 0);
    
    // Calculate the total
    const total = 
      skillValue +
      characteristicValue +
      (modifiedRollData.victoryPoints || 0) +
      (modifiedRollData.wyrdPoints || 0) +
      (modifiedRollData.extraModifiers || 0) +
      (modifiedRollData.modifier || 0);

    console.log("Roll calculation:", {
      skillValue,
      characteristicValue,
      characteristic: this.characteristic,
      victoryPoints: modifiedRollData.victoryPoints || 0,
      wyrdPoints: modifiedRollData.wyrdPoints || 0,
      extraModifiers: modifiedRollData.extraModifiers || 0,
      effectModifier: modifiedRollData.modifier || 0,
      total
    });

    // Process the roll result
    const result = processRollResult({ total }, dice);

    return {
      total,
      success: result.success,
      critical: result.critical,
      totalFailure: result.totalFailure,
      failure: result.failure,
      dice,
      result: total - dice,
      myRol,
      message: result.message
    };
  }

  async _doSingleRoll(rollData) {
    const roll = "1d20";

    let myRol = await new Roll(roll, rollData).evaluate();

    return this._prepareRoll(myRol.dice[0].results[0].result, rollData, myRol);
  }

  async _doDoubleRoll(rollData) {
    const roll = "2d20";

    const myRol = await new Roll(roll, rollData).evaluate();
    const roll1 = this._prepareRoll(
      myRol.dice[0].results[0].result,
      rollData,
      myRol,
    );
    const roll2 = this._prepareRoll(
      myRol.dice[0].results[1].result,
      rollData,
      myRol,
    );

    return {
      roll1,
      roll2,
    };
  }

  _getBest(roll1, roll2) {
    if (roll1.critical) {
      return roll1;
    }
    if (roll2.critical) {
      return roll2;
    }
    if (roll1.success && !roll2.success) {
      return roll1;
    }
    if (roll2.success && !roll1.success) {
      return roll2;
    }

    if (roll1.success && roll2.success) {
      return roll1.result < roll2.result ? roll1 : roll2;
    }

    if (roll1.totalFailure && !roll2.totalFailure) {
      return roll1;
    }
    if (roll2.totalFailure && !roll1.totalFailure) {
      return roll2;
    }
    return roll1.result < roll2.result ? roll1 : roll2;
  }

  /**
   * Get the blood background image based on the dice roll
   * @param {Number} dice - The dice roll result
   * @param {Object} roll - The roll object
   * @returns {String} The URL of the background image
   */
  getBloodBackground(dice, roll) {
    // Default blood background
    let bloodBackground = "systems/fading-suns/icons/blood.jpg";
    
    // Use different backgrounds based on the dice roll
    if (dice >= 1 && dice <= 5) {
      bloodBackground = "systems/fading-suns/icons/blood.jpg";
    } else if (dice >= 6 && dice <= 10) {
      bloodBackground = "systems/fading-suns/icons/blood.jpg";
    } else if (dice >= 11 && dice <= 15) {
      bloodBackground = "systems/fading-suns/icons/blood2.jpg";
    } else if (dice >= 16 && dice <= 19) {
      bloodBackground = "systems/fading-suns/icons/blood3.jpg";
    } else if (dice === 20) {
      bloodBackground = "systems/fading-suns/icons/blood4.jpg";
    }
    
    return bloodBackground;
  }

  async _calculateRoll(type, rollData) {
    // Prepare roll data with effect modifiers
    const preparedRollData = {
      ...rollData,
      characteristic: this.characteristic,
      skill: this.dataset.value,
      maneuver: this.maneuver,
      isWeapon: this.isWeapon,
      attackProperties: this.attackProperties,
      rollType: type
    };
    
    // Check if the actor cannot act due to effects
    if (this.effectModifiers.cannotAct) {
      return {
        myRol: null,
        total: 0,
        success: false,
        critical: false,
        failure: true,
        totalFailure: true,
        dice: 20,
        message: game.i18n.localize("FADING_SUNS.Roll.CannotAct")
      };
    }
    
    // Check for auto-fail
    if (this.effectModifiers.autoFail) {
      return {
        myRol: null,
        total: 0,
        success: false,
        critical: false,
        failure: true,
        totalFailure: true,
        dice: 20,
        message: game.i18n.localize("FADING_SUNS.Roll.AutoFail")
      };
    }
    
    // Check for random target
    if (this.effectModifiers.randomTarget) {
      // TODO: Implement random target selection
      ui.notifications.warn(game.i18n.localize("FADING_SUNS.Roll.RandomTarget"));
    }
    
    // Determine roll type based on effect modifiers
    const effectRollType = determineRollType(preparedRollData, this.actor);
    
    // Use the effect-determined roll type if it's different from the requested type
    const finalRollType = effectRollType !== "normal" ? effectRollType : type;
    
    if (finalRollType === "normal") {
      return this._doSingleRoll(preparedRollData);
    }

    const { roll1, roll2 } = await this._doDoubleRoll(preparedRollData);

    const best = this._getBest(roll1, roll2);

    if (finalRollType === "advantage") {
      return best;
    }

    return best === roll1 ? roll2 : roll1;
  }

  async _onClickRollDice(event, target) {
    const { resistancesTranslated, characteristicsTranslated } =
      this.getCalculatedData();

    const characteristicSelected = characteristicsTranslated.find(
      (c) => c.key === this.characteristic,
    ).translated;
    const characteristicValueSelected = characteristicsTranslated.find(
      (c) => c.key === this.characteristic,
    ).value;

    const resistanceSelected = resistancesTranslated.find(
      (c) => c.key === this.resistance,
    ).translated;
    const resistanceValueSelected = resistancesTranslated.find(
      (c) => c.key === this.resistance,
    ).value;

    const wyrdPoints = this.wyrdPointUsed ? 3 : 0;

    // Get extra VP cost from effects
    const extraVPCost = calculateExtraVPCost({
      characteristic: this.characteristic,
      skill: this.dataset.value,
      maneuver: this.maneuver,
      isWeapon: this.isWeapon,
      attackProperties: this.attackProperties,
      wyrdPointUsed: this.wyrdPointUsed
    }, this.actor);
    
    // Check if the actor can spend VP
    if (this.victoryPointsSelected > 0 && !canSpendVP(this.actor)) {
      ui.notifications.error(game.i18n.localize("FADING_SUNS.Errors.CannotSpendVP"));
      return;
    }
    
    // Calculate total VP cost (selected + extra)
    const totalVPCost = this.victoryPointsSelected + extraVPCost;
    
    // Check if the actor has enough VP
    if (totalVPCost > this.actor.system.bank.victoryPoints) {
      ui.notifications.error(game.i18n.format("FADING_SUNS.Errors.NotEnoughVP", { cost: totalVPCost }));
      return;
    }

    let rollData = {
      skill: this.dataset.value,
      characteristic: this.characteristic,
      victoryPointsSelected: this.victoryPointsSelected,
      wyrdPointUsed: this.wyrdPointUsed,
      extraModifiers: 0,
      maneuver: this.maneuver,
      isWeapon: this.isWeapon,
      attackProperties: this.attackProperties
    };

    if (Number(this.extraModifiers)) {
      rollData.extraModifiers = Number(this.extraModifiers);
    }

    const type = event.target.dataset.type;

    const { myRol, total, success, critical, totalFailure, failure, dice, message } =
      await this._calculateRoll(type, rollData);

    let chatMessage = `${this.dataset.label} (${this.dataset.value}) + ${characteristicSelected} (${characteristicValueSelected})`;
    if (this.victoryPointsSelected) {
      chatMessage += ` + ${this.victoryPointsSelected} + ${game.i18n.format("FADING_SUNS.messages.VP")}`;
      // Deduct VP cost (including extra cost from effects)
      this.actor.system.bank.victoryPoints -= totalVPCost;
      
      // If there was an extra VP cost, mention it in the message
      if (extraVPCost > 0) {
        chatMessage += ` (${game.i18n.format("FADING_SUNS.messages.EXTRA_VP_COST")}: ${extraVPCost})`;
      }
    }

    if (this.wyrdPointUsed) {
      chatMessage += ` + 3 + (${game.i18n.format("FADING_SUNS.messages.WYRD_POINT_USED")})`;
      this.actor.system.bank.wyrdPoints -= 1;
    }

    if (this.extraModifiers) {
      chatMessage += ` + ${this.extraModifiers} + (${game.i18n.format("FADING_SUNS.messages.EXTRA_MODIFIERS")})`;
    }
    
    // Add effect modifiers to the message if there are any
    if (this.effectModifiers.modifier) {
      chatMessage += ` + ${this.effectModifiers.modifier} + (${game.i18n.format("FADING_SUNS.messages.EFFECT_MODIFIERS")})`;
    }

    if (critical) {
      this.actor.system.bank.wyrdPoints += 1;
    }

    let successMessage = `${game.i18n.format("FADING_SUNS.messages.FAILURE")}`;
    let resistanceMessage = "";
    let maxVPToMoveToBank = 0;
    let canSpendVPToSucceed = false;
    let vpNeededToSucceed = 0;
    
    // Calculate if the roll could succeed by spending VP from bank
    if (failure && !totalFailure) {
      // Calculate how many VP would be needed to succeed
      vpNeededToSucceed = dice - total;
      
      // Check if the actor has enough VP in bank
      if (vpNeededToSucceed > 0 && this.actor.system.bank.victoryPoints >= vpNeededToSucceed) {
        canSpendVPToSucceed = true;
      }
    }
    
    if (!totalFailure && success) {
      successMessage =
        `${game.i18n.format("FADING_SUNS.messages.VICTORY_POINTS_EARNED")}`.replace(
          "$victory_points",
          dice,
        );

      if (!totalFailure && resistanceValueSelected !== "?") {
        successMessage = "";
        if (critical) {
          resistanceMessage =
            `${game.i18n.format("FADING_SUNS.messages.RESISTANCE_CRITICAL")}`.replace(
              "$vp",
              dice,
            );
        } else if (resistanceValueSelected > dice) {
          resistanceMessage =
            `${game.i18n.format("FADING_SUNS.messages.RESISTANCE_FAILURE")}`
              .replace("$resistance", resistanceValueSelected)
              .replace("$vp", dice)
              .replace("$difference", dice - resistanceValueSelected);
        } else {
          resistanceMessage =
            `${game.i18n.format("FADING_SUNS.messages.RESISTANCE_SUCCESS")}`
              .replace("$resistance", resistanceValueSelected)
              .replace("$vp", dice)
              .replace("$difference", dice - resistanceValueSelected);

        }
      }
    }

    if(success || critical) {
      const totalVP =  dice - (resistanceValueSelected !== "?" ? Number(resistanceValueSelected) : 0);
      const howManyCanMove = this.actor.system.bank.maxBankPoints - (this.actor.system.bank.victoryPoints + this.actor.system.bank.wyrdPoints);
      const totalCanMove = Math.min(howManyCanMove, totalVP);
      if(totalCanMove > 0) {
        maxVPToMoveToBank = new Array(totalCanMove).fill(totalCanMove).map((a, b) => b+1)
      }
      this.actor.system.cache = totalVP > 0 ? totalVP : dice;
      await this.actor.update({ system: this.actor.system });
    }

    // For defense rolls, we need to compare against the attack roll
    if (this.isDefense && this.attackTotal) {
      // Get the skill value
      let skillValue = 0;
      if (typeof this.dataset.value === 'number' || !isNaN(Number(this.dataset.value))) {
        skillValue = Number(this.dataset.value); // Direct value (defense rolls)
      } else {
        skillValue = Number(this.actor.system.skills[this.dataset.value]?.value || 0); // Look up skill
      }
      
      // Characteristic is a direct value in the Fading Suns system
      const characteristicValue = Number(this.actor.system.characteristics[this.characteristic] || 0);
      const modifierValue = (this.effectModifiers?.modifier || 0);
      const vpValue = Number(this.victoryPointsSelected || 0);
      const wyrdValue = this.wyrdPointUsed ? 3 : 0;
      const extraModValue = Number(this.extraModifiers || 0);
      
      const calculatedTotal = skillValue + characteristicValue + modifierValue + vpValue + wyrdValue + extraModValue;
      
      console.log("Defense calculation:", { 
        skillValue, 
        characteristicValue,
        characteristic: this.characteristic,
        modifierValue, 
        vpValue, 
        wyrdValue, 
        extraModValue, 
        calculatedTotal,
        attackTotal: this.attackTotal 
      });
      
      const defenseResult = calculatedTotal >= this.attackTotal;
      
      // Update the success/failure message for defense rolls
      if (defenseResult) {
        message = game.i18n.format("FADING_SUNS.messages.DEFENSE_SUCCESS");
        result = game.i18n.format("FADING_SUNS.messages.SUCCESS");
        success = true;
      } else {
        message = game.i18n.format("FADING_SUNS.messages.DEFENSE_FAILURE");
        result = game.i18n.format("FADING_SUNS.messages.FAILURE");
        success = false;
      }
      
      // Add a specific message for the defense type
      const defenseType = this.dataset.translated;
      successMessage = game.i18n.format("FADING_SUNS.messages.DEFENSE_ROLL", { 
        type: defenseType,
        total: calculatedTotal,
        attackTotal: this.attackTotal,
        result: defenseResult ? game.i18n.localize("FADING_SUNS.messages.SUCCESS") : game.i18n.localize("FADING_SUNS.messages.FAILURE")
      });
      
      // Use the calculated total for the defense result
      if (this.messageId) {
        // Find the original message
        const originalMessage = game.messages.get(this.messageId);
        if (originalMessage) {
          // Add a defense result note to the original message
          const defenseResultHtml = `
            <div class="defense-result ${defenseResult ? 'success' : 'failure'}">
              <i class="fas fa-${defenseResult ? 'check' : 'times'}"></i>
              ${this.actor.name} ${defenseResult ? game.i18n.localize("FADING_SUNS.messages.DEFENDED_SUCCESSFULLY") : game.i18n.localize("FADING_SUNS.messages.FAILED_TO_DEFEND")}
              (${this.dataset.translated}: ${calculatedTotal} vs ${this.attackTotal})
            </div>
          `;
          
          // Get the message content
          let content = originalMessage.content;
          
          // Add the defense result note before the closing div of defense-options
          content = content.replace('</div>\n      {{/if}}', `${defenseResultHtml}</div>\n      {{/if}}`);
          
          // Update the message
          await originalMessage.update({ content });
        }
      }
    }

    // Determine if this is an attack and what type
    let isAttack = false;
    let isRangedAttack = false;
    let isMeleeAttack = false;
    let isSocialMentalAttack = false;
    
    // Check if this is an attack based on skill or item type
    if (this.isWeapon) {
      isAttack = true;
      
      // Determine attack type based on weapon type or skill
      if (this.dataset.itemId) {
        const item = this.actor.items.get(this.dataset.itemId);
        if (item) {
          if (item.type === "FirearmWeapon") {
            isRangedAttack = true;
          } else if (item.type === "MeleeWeapon") {
            isMeleeAttack = true;
          }
        }
      } else if (this.dataset.label) {
        // Determine attack type based on skill
        const skillName = this.dataset.label.toLowerCase();
        if (skillName.includes("disparar")) {
          isRangedAttack = true;
        } else if (skillName.includes("cuerpo a cuerpo") || skillName.includes("pelear")) {
          isMeleeAttack = true;
        }
      }
    } else if (this.characteristic) {
      // Check for mental or social attacks
      const mentalChars = ['int', 'wits', 'tec'];
      const socialChars = ['pre', 'ego', 'pas', 'fth'];
      
      if (mentalChars.includes(this.characteristic) || socialChars.includes(this.characteristic)) {
        // If it's a mental or social skill and targeting another character
        if (this.target) {
          isAttack = true;
          isSocialMentalAttack = true;
        }
      }
    }

    // For defense rolls, make sure we use the correctly calculated total
    let displayTotal = total;
    let defenseSuccess = false;
    
    if (this.isDefense && this.attackTotal) {
      // Use the correctly calculated total from the defense calculation code above
      displayTotal = calculatedTotal;
      defenseSuccess = defenseResult; 
    }

    // Add attack information to template data
    const templateData = {
      dice,
      getBloodBackground: this.getBloodBackground(dice, myRol),
      message,
      result: message || this._getMessage(
        success,
        critical,
        totalFailure,
        dice - resistanceValueSelected,
      ),
      successMessage,
      resistanceMessage,
      total: displayTotal, // Use the corrected total for display
      actorId: this.actor.id,
      messageId: randomID(),
      targetId: this.target?.id,
      maneuver: this.maneuver,
      effectModifiers: this.effectModifiers,
      isAttack,
      isRangedAttack,
      isMeleeAttack,
      isSocialMentalAttack,
      isDefense: this.isDefense,
      attackTotal: this.attackTotal,
      defenseSuccess: defenseSuccess, // Use the correct success value
      attackerId: this.attackerId,
      originalMessageId: this.messageId,
      canSpendVPToSucceed, // Add the possibility to spend VP to succeed
      vpNeededToSucceed // Add the number of VP needed to succeed
    };

    const content = await renderTemplate(
      "systems/fading-suns/templates/chat/roll.hbs",
      templateData,
    );

    const chatData = {
      speaker: ChatMessage.getSpeaker({ alias: this.name }),
      content: content,
      rolls: [myRol],
    };

    ChatMessage.create(chatData);

    await this.actor.update({ system: this.actor.system });
    if((success || critical) && this.damage) {
      const bank = dice - resistanceValueSelected;
      const vp = this.actor.system.bank.victoryPoints;
      
      // Calculate damage using our helper function
      if (this.dataset.itemId) {
        const weapon = this.actor.items.get(this.dataset.itemId);
        if (weapon) {
          const damageData = calculateDamage(
            { success, critical },
            weapon,
            resistanceValueSelected !== "?" ? Number(resistanceValueSelected) : 0
          );
          
          this._showDamageMessage({ 
            bank, 
            vp, 
            damage: this.damage,
            damageData
          });
        } else {
          this._showDamageMessage({ bank, vp, damage: this.damage });
        }
      } else {
        this._showDamageMessage({ bank, vp, damage: this.damage });
      }
    }

    this.close();
  }

  async _showDamageMessage({ bank, vp, damage, damageData }) {
    // Make sure damage is defined, default to 0 if not
    const damageValue = damage || 0;
    
    // Create a properly formatted message with the localized string
    const weaponDamage = game.i18n.format("FADING_SUNS.damageChat.weaponDamage", {damage: damageValue});
    
    // Prepare template data
    const templateData = {
      weaponDamage,
      bank,
      vp
    };
    
    // Add damage calculation data if available
    if (damageData) {
      templateData.damageFormula = damageData.damageFormula;
      templateData.damageResult = damageData.damageResult;
      templateData.resistance = damageData.resistance;
      templateData.finalDamage = damageData.finalDamage;
    }

    const content = await renderTemplate(
      "systems/fading-suns/templates/chat/damage.hbs",
      templateData,
    );
    
    const chatData = {
      speaker: ChatMessage.getSpeaker({ alias: this.name }),
      content: content,
    };

    ChatMessage.create(chatData);
  }
}

window.RollDice = RollDice;
