import RollDice from "../dialogs/rollDice.mjs";

/**
 * Define your class that extends FormApplication
 */
export default class Maneuver extends FormApplication {
  constructor(actor, dataset, isWeapon = false) {
    super();
    this.actor = actor;
    this.dataset = dataset;
    this.isWeapon = isWeapon;
  }

  static get defaultOptions() {
    return mergeObject(super.defaultOptions, {
      classes: ["form"],
      popOut: true,
      template: "systems/fading-suns/templates/dialogs/maneuver.hbs",
      id: "Maneuver",
      title: game.i18n.format(`FADING_SUNS.LETS_ROL`),
      width: 750,
      actions: {
        viewDoc: this._viewDoc,
      },
    });
  }

  _getSkillByName(skill) {
    return game.items.filter((i) => i.type === "Skill" && i.name === skill);
  }

  _getSkill(skill) {
    const skillF = this._getSkillByName(skill);

    if (skillF && skillF[0])
      return {
        name: skill,
        description: skillF[0].system?.description,
      };
  }

  _getManeuversBySkill(skill) {
    return game.items.filter(
      (i) => i.type === "Maneuver" && i.system?.roll?.skill === skill,
    );
  }

  _getManeuverById(id) {
    return game.items.find((i) => i.id === id);
  }

  getCalculatedData() {}

  getData() {
    const skill = this._getSkill(this.dataset.translated);
    console.log(skill);
    const maneuvers = this._getManeuversBySkill(this.dataset.label);
    return {
      skill,
      maneuvers,
    };
  }

  async _viewDoc(target) {
    const doc = this._getManeuverById(target);
    doc.sheet.render(true);
  }

  async _rollManeuver(target) {
    if (!target.label) {
      const dataset = {
        ...this.dataset,
        isWeapon: this.isWeapon
      };
      return new RollDice(this.actor, dataset).render(true);
    }
    const doc = this._getManeuverById(target.label);

    const dataset = {
      ...this.dataset,
      characteristic: doc.system.roll.characteristic,
      modifier: doc.system.modifier,
      maneuver: doc,
      isWeapon: this.isWeapon
    };

    const roll = new RollDice(this.actor, dataset).render(true);
  }

  activateListeners(html) {
    //super.activateListeners(html);
    html.find('button[name="viewDoc"]').click((event) => {
      this._viewDoc($(event.currentTarget).data("item-id"));
      this.close();
    });

    html.find('label[name="roll-feature"').click((event) => {
      this._rollManeuver(event.currentTarget.dataset);
      this.close();
    });
  }

  async _updateObject(event, formData) {
    console.log(formData);
  }
}

window.Maneuver = Maneuver;
