import { mergeObject } from '../helpers/utils.mjs';
import { parseAttackProperties, calculateEffectiveResistance, getResistanceLevel } from '../helpers/combat.mjs';

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
    
    // If this is a weapon, parse attack properties from Features field
    if (this.isWeapon && this.dataset.itemId) {
      const item = this.actor.items.get(this.dataset.itemId);
      if (item && item.system.Features) {
        this.attackProperties = parseAttackProperties(item.system.Features);
      }
    }
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
        // Get base body resistance
        const baseBodyResistance = targetActor.system?.res?.body?.value || 0;
        
        // Get armor resistances from equipped armor
        let armorResistances = null;
        
        // Find equipped armor items
        const equippedArmor = targetActor.items.filter(item => 
          item.type === 'Armor' && item.system.equipped);
        
        if (equippedArmor.length > 0) {
          // Use the first equipped armor for simplicity
          // In a more complex system, you might want to combine multiple armor pieces
          armorResistances = equippedArmor[0].system;
        }
        
        // Calculate effective resistance based on attack properties and armor
        const effectiveResistance = calculateEffectiveResistance(
          baseBodyResistance,
          this.attackProperties,
          armorResistances
        );
        
        // Add coverage modifiers
        let totalResistance = effectiveResistance;
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

    const totalRoll =
      Number(this.dataset.value) +
      Number(characteristicValueSelected) +
      Number(this.victoryPointsSelected) +
      (this.wyrdPointUsed ? 3 : 0) +
      Number(this.extraModifiers);

    return {
      extraModifiers: this.extraModifiers,
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
    this.victoryPointsSelected = Number(event.currentTarget.value);
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

  _getMessage(success, critical, totalFailure, resistance, maneuver) {
    if (totalFailure)
      return game.i18n.format("FADING_SUNS.messages.TOTAL_FAILURE");
    if (!success) return game.i18n.format("FADING_SUNS.messages.FAILURE");
    if (critical) return game.i18n.format("FADING_SUNS.messages.CRITICAL");
    if (resistance < 0) return game.i18n.format("FADING_SUNS.messages.FAILURE");
    return game.i18n.format("FADING_SUNS.messages.SUCCESS");
  }

  _prepareRoll(dice, rollData, myRol) {
    const total =
      Number(this.dataset.value) +
      Number(rollData.characteristic) +
      rollData.victoryPoints +
      rollData.wyrdPoints +
      rollData.extraModifiers;

    const success = dice <= total;
    const failure = dice > total;
    const critical = dice === total;
    const totalFailure = dice === 20;
    const result = total - dice;

    return {
      total,
      success,
      critical,
      totalFailure,
      failure,
      dice,
      result,
      myRol,
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
    if (type === "normal") {
      return this._doSingleRoll(rollData);
    }

    const { roll1, roll2 } = await this._doDoubleRoll(rollData);

    const best = this._getBest(roll1, roll2);

    if (type === "advantage") {
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

    let rollData = {
      skill: this.dataset.value,
      characteristic: characteristicValueSelected,
      victoryPoints: 0,
      wyrdPoints: 0,
      extraModifiers: 0,
    };

    if (Number(this.extraModifiers)) {
      rollData.extraModifiers = Number(this.extraModifiers);
    }

    if (Number(this.victoryPointsSelected)) {
      rollData.victoryPoints = Number(this.victoryPointsSelected);
    }

    if (wyrdPoints) {
      rollData.wyrdPoints = wyrdPoints;
    }

    const type = event.target.dataset.type;

    const { myRol, total, success, critical, totalFailure, failure, dice } =
      await this._calculateRoll(type, rollData);

    let message = `${this.dataset.label} (${this.dataset.value}) + ${characteristicSelected} (${characteristicValueSelected})`;
    if (this.victoryPointsSelected) {
      message += ` + ${this.victoryPointsSelected} + ${game.i18n.format("FADING_SUNS.messages.VP")}`;
      this.actor.system.bank.victoryPoints -= this.victoryPointsSelected;
    }

    if (this.wyrdPointUsed) {
      message += ` + 3 + (${game.i18n.format("FADING_SUNS.messages.WYRD_POINT_USED")})`;
      this.actor.system.bank.wyrdPoints -= 1;
    }

    if (this.extraModifiers) {
      message += ` + ${this.extraModifiers} + (${game.i18n.format("FADING_SUNS.messages.EXTRA_MODIFIERS")})`;
      this.actor.system.bank.wyrdPoints -= 1;
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
      result: this._getMessage(
        success,
        critical,
        totalFailure,
        dice - resistanceValueSelected,
      ),
      message,
      successMessage,
      resistanceMessage,
      dice,
      total,
      maxVPToMoveToBank,
      maneuver: this.maneuver,
      actorId: this.actor._id,
      canSpendVPToSucceed,
      vpNeededToSucceed
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
      // this._showDamageMessage({ bank, vp, damage: this.damage });
    }
    this.close();
  }

  async _showDamageMessage( { bank, vp, damage }) {
    const weaponDamage = game.i18n.format("FADING_SUNS.damageChat.weaponDamage").replace('{{damage}}', damage)

    const content = await renderTemplate(
      "systems/fading-suns/templates/chat/damage.hbs",
      {
        weaponDamage,
        bank,
        vp
      },
    );
    const chatData = {
      speaker: ChatMessage.getSpeaker({ alias: this.name }),
      content: content,
    };

    ChatMessage.create(chatData);

   }
}

window.RollDice = RollDice;
