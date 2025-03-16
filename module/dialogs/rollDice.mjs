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
    
    // Calculate total roll
    const totalRoll =
      Number(this.dataset.value) +
      Number(characteristicValueSelected) +
      Number(this.victoryPointsSelected) +
      (this.wyrdPointUsed ? 3 : 0) +
      Number(this.extraModifiers) +
      (modifiedRollData.modifier || 0);

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
    
    // Calculate the total
    const total =
      Number(this.actor.system.skills[this.dataset.value]?.value || 0) +
      Number(this.actor.system.characteristics[this.characteristic]?.value || 0) +
      (modifiedRollData.victoryPoints || 0) +
      (modifiedRollData.wyrdPoints || 0) +
      (modifiedRollData.extraModifiers || 0) +
      (modifiedRollData.modifier || 0);

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

    const templateData = {
      result: message || this._getMessage(
        success,
        critical,
        totalFailure,
        dice - resistanceValueSelected,
      ),
      message: chatMessage,
      successMessage,
      resistanceMessage,
      dice,
      total,
      maxVPToMoveToBank,
      maneuver: this.maneuver,
      actorId: this.actor._id,
      canSpendVPToSucceed,
      vpNeededToSucceed,
      effectModifiers: this.effectModifiers
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
    const weaponDamage = game.i18n.format("FADING_SUNS.damageChat.weaponDamage").replace('{{damage}}', damage);
    
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
