import { createEffectCategories } from "../helpers/effects.mjs";
import { CHARACTERISTICS, SKILLS, ITEM_TYPES, TEMPLATES, TABS, MANEUVER_TYPES, POWER_TYPES, PARTS } from "../helpers/constants.mjs";
import { createDragDropHandlers, getEffect } from "../helpers/drag-drop.mjs";
import { prepareOrderedSkills, prepareCharacteristics, prepareOrderedTypesOfManeuver, prepareOrderedTypesOfPower, prepareOrderedSchoolOfPower } from "../helpers/prepare-data.mjs";
import { PredefinedEffectsDialog } from "../dialogs/predefined-effects-dialog.mjs";

const { api, sheets } = foundry.applications;

/**
 * Extend the basic ItemSheet with some very simple modifications
 * @extends {ItemSheetV2}
 */
export class FadingSunsItemSheet extends api.HandlebarsApplicationMixin(
  sheets.ItemSheetV2,
) {
  constructor(options = {}) {
    super(options);
    this.#dragDrop = createDragDropHandlers(this, this.options.dragDrop);
  }

  characteristics = [
    CHARACTERISTICS.STR,
    CHARACTERISTICS.DEX,
    CHARACTERISTICS.END,
    CHARACTERISTICS.WITS,
    CHARACTERISTICS.PER,
    CHARACTERISTICS.WILL,
    CHARACTERISTICS.PRE,
    CHARACTERISTICS.INT,
    CHARACTERISTICS.FTH,
  ];
  skills = [
    SKILLS.ACADEMIA,
    SKILLS.ALCHEMY,
    SKILLS.ANIMALIA,
    SKILLS.ARTS,
    SKILLS.CHARM,
    SKILLS.CRAFTS,
    SKILLS.DISGUISE,
    SKILLS.DRIVE,
    SKILLS.EMPATHY,
    SKILLS.FIGHT,
    SKILLS.FOCUS,
    SKILLS.IMPRESS,
    SKILLS.INTERFACE,
    SKILLS.INTRUSION,
    SKILLS.KNAVERY,
    SKILLS.MELEE,
    SKILLS.OBSERVE,
    SKILLS.PERFORM,
    SKILLS.PILOT,
    SKILLS.REMEDY,
    SKILLS.SHOOT,
    SKILLS.SLEIGHT_OF_HAND,
    SKILLS.SNEAK,
    SKILLS.SURVIVAL,
    SKILLS.TECH_REDEMPTION,
    SKILLS.VIGOR,
  ];
  maneuverTypes = [
    MANEUVER_TYPES.ACTION,
    MANEUVER_TYPES.COMBAT,
    MANEUVER_TYPES.DEFENSE,
    MANEUVER_TYPES.INFLUENCE
  ];
  powerTypes = [
    POWER_TYPES.PSIONIC,
    POWER_TYPES.THEURGY
  ];

  /** @override */
  static DEFAULT_OPTIONS = {
    classes: ["fading-suns", "item"],
    position: {
      width: 800,
      height: 800,
    },
    actions: {
      onEditImage: this._onEditImage,
      viewDoc: this._viewEffect,
      createDoc: this._createEffect,
      deleteDoc: this._deleteEffect,
      toggleEffect: this._toggleEffect,
    },
    form: {
      submitOnChange: true,
    },
    // Custom property that's merged into `this.options`
    dragDrop: [{ dragSelector: "[data-drag]", dropSelector: null }],
  };

  /* -------------------------------------------- */

  /** @override */
  static PARTS = {
    header: {
      template: TEMPLATES.ITEM.HEADER,
    },
    tabs: {
      // Foundry-provided generic template
      template: TEMPLATES.GENERIC.TAB_NAVIGATION,
    },
    description: {
      template: TEMPLATES.ITEM.DESCRIPTION,
    },
    attributesFeature: {
      template: TEMPLATES.ITEM.FEATURE,
    },
    attributesGeneric: {
      template: TEMPLATES.ITEM.GENERIC,
    },
    attributesGear: {
      template: TEMPLATES.ITEM.GEAR,
    },
    attributesArmor: {
      template: TEMPLATES.ITEM.ARMOR,
    },
    attributesFirearmWeapon: {
      template: TEMPLATES.ITEM.FIREARM_WEAPON,
    },
    attributesStatus: {
      template: TEMPLATES.ITEM.STATUS,
    },
    attributesMeleeWeapon: {
      template: TEMPLATES.ITEM.MELEE_WEAPON,
    },
    effects: {
      template: TEMPLATES.ITEM.EFFECTS,
    },
    maneuver: {
      template: TEMPLATES.ITEM.MANEUVER,
    },
    power: {
      template: TEMPLATES.ITEM.POWER,
    },
  };

  /** @override */
  _configureRenderOptions(options) {
    super._configureRenderOptions(options);

    if (![ ITEM_TYPES.MANEUVER, ITEM_TYPES.POWER ].includes(this.document.type)) {
      options.parts = [PARTS.HEADER, PARTS.TABS, PARTS.DESCRIPTION];
    } else {
      options.parts = [];
    }

    // Don't show the other tabs if only limited view
    if (this.document.limited) return;
    // Control which parts show based on document subtype
    switch (this.document.type) {
      case ITEM_TYPES.FEATURE:
        options.parts.push(PARTS.ATTRIBUTES_FEATURE, PARTS.EFFECTS);
        break;
      case ITEM_TYPES.COMBAT:
        options.parts.push(PARTS.ATTRIBUTES_COMBAT);
        break;
      case ITEM_TYPES.PERKS:
        options.parts.push(PARTS.ATTRIBUTES_PERKS);
        break;
      case ITEM_TYPES.POWERS:
        options.parts.push(PARTS.ATTRIBUTES_POWERS);
        break;
      case ITEM_TYPES.GEAR:
        options.parts.push(PARTS.ATTRIBUTES_GEAR);
        break;
      case ITEM_TYPES.GENERIC:
        options.parts.push(PARTS.ATTRIBUTES_GENERIC);
        break;
      case ITEM_TYPES.ARMOR:
        options.parts.push(PARTS.ATTRIBUTES_ARMOR);
        break;
      case ITEM_TYPES.FIREARM_WEAPON:
        options.parts.push(PARTS.ATTRIBUTES_FIREARM_WEAPON);
        break;
      case ITEM_TYPES.STATUS:
        options.parts.push(PARTS.ATTRIBUTES_STATUS);
        break;        
      case ITEM_TYPES.MELEE_WEAPON:
        options.parts.push(PARTS.ATTRIBUTES_MELEE_WEAPON);
        break;
      case ITEM_TYPES.MANEUVER:
        options.parts.push(PARTS.MANEUVER);
        break;
      case ITEM_TYPES.POWER:
        options.parts.push(PARTS.POWER);
        break;
    }
  }

  /* -------------------------------------------- */

  _getSkillsAndCharacteristicsIfNeeded(options) {
    if (options.parts[0] === PARTS.MANEUVER) {
      return {
        skills: prepareOrderedSkills(this.skills, this.item.system.roll.skill),
        characteristics: prepareCharacteristics(this.characteristics, this.item.system.roll.characteristic),
        maneuverTypes: prepareOrderedTypesOfManeuver(this.maneuverTypes, this.item.system.type),
      };
    }
    if (options.parts[0] === PARTS.POWER) {
      return {
        skills: prepareOrderedSkills(this.skills, this.item.system.roll.skill),
        characteristics: prepareCharacteristics(this.characteristics, this.item.system.roll.characteristic),
        powerTypes: prepareOrderedTypesOfPower(this.powerTypes, this.item.system.type),
      };
    }
    return {};
  }

  /** @override */
  async _prepareContext(options) {
    // Not all parts always render
    const context = {
      // Validates both permissions and compendium status
      editable: this.isEditable,
      owner: this.isOwner,
      limited: this.document.limited,
      // Add the item document.
      item: this.item,
      // Adding system and flags for easier access
      system: this.item.system,
      flags: this.item.flags,
      // Adding a pointer to CONFIG.FADING_SUNS
      config: CONFIG.FADING_SUNS,
      // You can factor out context construction to helper functions
      tabs: this._getTabs(options.parts),
      ...this._getSkillsAndCharacteristicsIfNeeded(options),
    };

    return context;
  }

  /** @override */
  async _preparePartContext(partId, context) {
    switch (partId) {
      case PARTS.ATTRIBUTES_GENERIC:
      case PARTS.ATTRIBUTES_ARMOR:
      case PARTS.ATTRIBUTES_FIREARM_WEAPON:
      case PARTS.ATTRIBUTES_STATUS:
      case PARTS.ATTRIBUTES_MELEE_WEAPON:
      case PARTS.ATTRIBUTES_FEATURE:
      case PARTS.ATTRIBUTES_COMBAT:
      case PARTS.ATTRIBUTES_GEAR:
        // Necessary for preserving active tab on re-render
        context.tab = context.tabs[partId];
        break;

      case PARTS.DESCRIPTION:
        context.tab = context.tabs[partId];
        // Enrich description info for display
        // Enrichment turns text like `[[/r 1d20]]` into buttons
        context.enrichedDescription = await TextEditor.enrichHTML(
          this.item.system.description,
          {
            // Whether to show secret blocks in the finished html
            secrets: this.document.isOwner,
            // Data to fill in for inline rolls
            rollData: this.item.getRollData(),
            // Relative UUID resolution
            relativeTo: this.item,
          },
        );
        break;
      case PARTS.EFFECTS:
        context.tab = context.tabs[partId];
        // Prepare active effects for easier access
        context.effects = createEffectCategories(this.item.effects);
        break;
      case PARTS.POWER:
      case PARTS.MANEUVER:
      case PARTS.IMPACT:
        // Enrich description info for display
        // Enrichment turns text like `[[/r 1d20]]` into buttons
        context.enrichedDescription = await TextEditor.enrichHTML(
          this.item.system.description,
          {
            // Whether to show secret blocks in the finished html
            secrets: this.document.isOwner,
            // Data to fill in for inline rolls
            rollData: this.item.getRollData(),
            // Relative UUID resolution
            relativeTo: this.item,
          },
        );
        context.enrichedTime = await TextEditor.enrichHTML(
          this.item.system.time,
          {
            // Whether to show secret blocks in the finished html
            secrets: this.document.isOwner,
            // Data to fill in for inline rolls
            rollData: this.item.getRollData(),
            // Relative UUID resolution
            relativeTo: this.item,
          },
        );
        context.enrichedCompetence = await TextEditor.enrichHTML(
          this.item.system.competence,
          {
            // Whether to show secret blocks in the finished html
            secrets: this.document.isOwner,
            // Data to fill in for inline rolls
            rollData: this.item.getRollData(),
            // Relative UUID resolution
            relativeTo: this.item,
          },
        );
        context.enrichedResistance = await TextEditor.enrichHTML(
          this.item.system.resistance,
          {
            // Whether to show secret blocks in the finished html
            secrets: this.document.isOwner,
            // Data to fill in for inline rolls
            rollData: this.item.getRollData(),
            // Relative UUID resolution
            relativeTo: this.item,
          },
        );
        context.enrichedImpact = await TextEditor.enrichHTML(
          this.item.system.impact,
          {
            // Whether to show secret blocks in the finished html
            secrets: this.document.isOwner,
            // Data to fill in for inline rolls
            rollData: this.item.getRollData(),
            // Relative UUID resolution
            relativeTo: this.item,
          },
        );
        break;
    }
    return context;
  }

  /**
   * Generates the data for the generic tab navigation template
   * @param {string[]} parts An array of named template parts to render
   * @returns {Record<string, Partial<ApplicationTab>>}
   * @protected
   */
  _getTabs(parts) {
    // If you have sub-tabs this is necessary to change
    const tabGroup = "primary";
    // Default tab for first time it's rendered this session
    if (!this.tabGroups[tabGroup]) this.tabGroups[tabGroup] = PARTS.DESCRIPTION;
    return parts.reduce((tabs, partId) => {
      const tab = {
        cssClass: "",
        group: tabGroup,
        // Matches tab property to
        id: "",
        // FontAwesome Icon, if you so choose
        icon: "",
        // Run through localization
        label: "FADING_SUNS.Item.Tabs.",
      };
      switch (partId) {
        case PARTS.HEADER:
        case PARTS.TABS:
          return tabs;
        case PARTS.DESCRIPTION:
          tab.id = TABS.DESCRIPTION;
          tab.label += "Description";
          break;
        case PARTS.ATTRIBUTES_ARMOR:
          tab.id = PARTS.ATTRIBUTES_ARMOR;
          tab.label += "Attributes";
          break;
        case PARTS.ATTRIBUTES_GENERIC:
          tab.id = PARTS.ATTRIBUTES_GENERIC;
          tab.label += "Attributes";
          break;
        case PARTS.ATTRIBUTES_FIREARM_WEAPON:
          tab.id = PARTS.ATTRIBUTES_FIREARM_WEAPON;
          tab.label += "Attributes";
          break;
        case PARTS.ATTRIBUTES_STATUS:
          tab.id = PARTS.ATTRIBUTES_STATUS;
          tab.label += "Attributes";
          break;          
        case PARTS.ATTRIBUTES_MELEE_WEAPON:
          tab.id = PARTS.ATTRIBUTES_MELEE_WEAPON;
          tab.label += "Attributes";
          break;
        case PARTS.ATTRIBUTES_FEATURE:
        case PARTS.ATTRIBUTES_GEAR:
          tab.id = TABS.ATTRIBUTES;
          tab.label += "Attributes";
          break;
        case PARTS.EFFECTS:
          tab.id = TABS.EFFECTS;
          tab.label += "Effects";
          break;
        case PARTS.MANEUVER:
          tab.id = TABS.MANEUVER;
          tab.label += "Maneuver";
          this.tabGroups[tabGroup] = TABS.MANEUVER;
          break;
        case PARTS.POWER:
          tab.id = TABS.POWER;
          tab.label += "Power";
          this.tabGroups[tabGroup] = TABS.POWER;
          break;
      }
      if (this.tabGroups[tabGroup] === tab.id) tab.cssClass = "active";
      tabs[partId] = tab;
      return tabs;
    }, {});
  }

  /**
   * Actions performed after any render of the Application.
   * Post-render steps are not awaited by the render process.
   * @param {ApplicationRenderContext} context      Prepared context data
   * @param {RenderOptions} options                 Provided render options
   * @protected
   */
  _onRender(context, options) {
    this.#dragDrop.forEach((d) => d.bind(this.element));
    // You may want to add other special handling here
    // Foundry comes with a large number of utility classes, e.g. SearchFilter
    // That you may want to implement yourself.
  }

  /**************
   *
   *   ACTIONS
   *
   **************/

  /**
   * Handle changing a Document's image.
   *
   * @this GrimwildActorSheet
   * @param {PointerEvent} event   The originating click event
   * @param {HTMLElement} target   The capturing HTML element which defined a [data-action]
   * @returns {Promise}
   * @protected
   */
  static async _onEditImage(event, target) {
    const attr = target.dataset.edit;
    const current = foundry.utils.getProperty(this.document, attr);
    const { img } =
      this.document.constructor.getDefaultArtwork?.(this.document.toObject()) ??
      {};
    const fp = new FilePicker({
      current,
      type: "image",
      redirectToRoot: img ? [img] : [],
      callback: (path) => {
        target.src = path;
        this.document.update({ img: path });
      },
      top: this.position.top + 40,
      left: this.position.left + 10,
    });
    return fp.browse();
  }

  /**
   * Renders an embedded document's sheet
   *
   * @this FadingSunsActorSheet
   * @param {PointerEvent} event   The originating click event
   * @param {HTMLElement} target   The capturing HTML element which defined a [data-action]
   * @protected
   */
  static async _viewEffect(event, target) {
    const effect = getEffect.call(this, target);
    effect.sheet.render(true);
  }

  /**
   * Handles item deletion
   *
   * @this FadingSunsActorSheet
   * @param {PointerEvent} event   The originating click event
   * @param {HTMLElement} target   The capturing HTML element which defined a [data-action]
   * @protected
   */
  static async _deleteEffect(event, target) {
    const effect = getEffect.call(this, target);
    await effect.delete();
  }

  /**
   * Handle creating a new Owned Item or ActiveEffect for the actor using initial data defined in the HTML dataset
   *
   * @this FadingSunsActorSheet
   * @param {PointerEvent} event   The originating click event
   * @param {HTMLElement} target   The capturing HTML element which defined a [data-action]
   * @private
   */
  static async _createEffect(event, target) {
    // Retrieve the configured document class for ActiveEffect
    const aeCls = getDocumentClass("ActiveEffect");
    // Prepare the document creation data by initializing it a default name.
    // As of v12, you can define custom Active Effect subtypes just like Item subtypes if you want
    const effectData = {
      name: aeCls.defaultName({
        // defaultName handles an undefined type gracefully
        type: target.dataset.type,
        parent: this.item,
      }),
    };
    // Loop through the dataset and add it to our effectData
    for (const [dataKey, value] of Object.entries(target.dataset)) {
      // These data attributes are reserved for the action handling
      if (["action", "documentClass"].includes(dataKey)) continue;
      // Nested properties require dot notation in the HTML, e.g. anything with `system`
      // An example exists in spells.hbs, with `data-system.spell-level`
      // which turns into the dataKey 'system.spellLevel'
      foundry.utils.setProperty(effectData, dataKey, value);
    }

    // Finally, create the embedded document!
    await aeCls.create(effectData, { parent: this.item });
  }

  /**
   * Determines effect parent to pass to helper
   *
   * @this FadingSunsActorSheet
   * @param {PointerEvent} event   The originating click event
   * @param {HTMLElement} target   The capturing HTML element which defined a [data-action]
   * @private
   */
  static async _toggleEffect(event, target) {
    const effect = getEffect.call(this, target);
    await effect.update({ disabled: !effect.disabled });
  }

  /**
   * Returns an array of DragDrop instances
   * @type {DragDrop[]}
   */
  get dragDrop() {
    return this.#dragDrop;
  }

  // This is marked as private because there's no real need
  // for subclasses or external hooks to mess with it directly
  #dragDrop;

  /** @override */
  activateListeners(html) {
    super.activateListeners(html);

    // Everything below here is only needed if the sheet is editable
    if (!this.isEditable) return;

    // Active Effect management
    html.find(".effect-control").click(ev => {
      const button = ev.currentTarget;
      const li = ev.currentTarget.closest("li");
      const effect = li.dataset.effectId ? this.item.effects.get(li.dataset.effectId) : null;
      switch (button.dataset.action) {
        case "createDoc":
          // Replace the default effect creation with our dialog
          if (button.dataset.documentClass === "ActiveEffect") {
            const dialog = new PredefinedEffectsDialog(this.item);
            dialog.render(true);
            return;
          }
          return ItemSheet._createEffect(event, button);
        case "toggleEffect":
          return effect.update({disabled: !effect.disabled});
        case "viewDoc":
          return effect.sheet.render(true);
        case "deleteDoc":
          return effect.delete();
      }
    });
  }
}
