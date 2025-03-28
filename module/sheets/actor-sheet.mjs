import { createEffectCategories } from "../helpers/effects.mjs";
import RollDice from "../dialogs/rollDice.mjs";
import Maneuver from "../dialogs/maneuver.mjs";
import { PredefinedEffectsDialog } from "../dialogs/predefined-effects-dialog.mjs";
import { updateActorSpeciesAttributes } from "../helpers/species.mjs";

const { api, sheets } = foundry.applications;

/**
 * Extend the basic ActorSheet with some very simple modifications
 * @extends {ActorSheetV2}
 */
export class FadingSunsActorSheet extends api.HandlebarsApplicationMixin(
  sheets.ActorSheetV2,
) {
  constructor(options = {}) {
    super(options);
    this.#dragDrop = this.#createDragDropHandlers();
  }

  /** @override */
  static DEFAULT_OPTIONS = {
    classes: ["fading-suns", "actor"],
    position: {
      width: 1100,
      height: 760,
    },
    resizable: true,
    actions: {
      useVP: this._useVP,
      onEditImage: this._onEditImage,
      viewDoc: this._viewDoc,
      viewJournal: this._viewJournalEntry,
      createDoc: this._createDoc,
      deleteDoc: this._deleteDoc,
      toggleEffect: this._toggleEffect,
      toggleArmor: this._toggleArmor,
      roll: this._onRoll,
      rollWeapon: this._onRollWeapon,
      useRevival: this._useRevival,
      useSurge: this._useSurge,
      viewCharacteristic: this._viewCharacteristic,
      openPredefinedEffectsDialog: this._openPredefinedEffectsDialog,
    },
    // Custom property that's merged into `this.options`
    dragDrop: [{ dragSelector: "[data-drag]", dropSelector: null }],
    form: {
      submitOnChange: true,
    },
    window: {
      resizable: true,
    },
  };

  /** @override */
  static PARTS = {
    header: {
      template: "systems/fading-suns/templates/actor/header.hbs",
    },
    tabs: {
      // Foundry-provided generic template
      template: "templates/generic/tab-navigation.hbs",
    },
    features: {
      template: "systems/fading-suns/templates/actor/features.hbs",
    },
    biography: {
      template: "systems/fading-suns/templates/actor/biography.hbs",
    },
    perks: {
      template: "systems/fading-suns/templates/actor/perks.hbs",
    },
    powers: {
      template: "systems/fading-suns/templates/actor/powers.hbs",
    },
    combat: {
      template: "systems/fading-suns/templates/actor/combat.hbs",
    },
    gear: {
      template: "systems/fading-suns/templates/actor/gear.hbs",
    },
    effects: {
      template: "systems/fading-suns/templates/actor/effects.hbs",
    },
  };

  /** @override */
  _configureRenderOptions(options) {
    super._configureRenderOptions(options);
    // Not all parts always render
    options.parts = ["header", "tabs", "features"];
    // Don't show the other tabs if only limited view
    if (this.document.limited) return;
    // Control which parts show based on document subtype
    switch (this.document.type) {
      case "Character":
        options.parts.push(
          "combat",
          "gear",
          "effects",
          "perks",
          "powers",
          "biography",
        );
        break;
      case "Npc":
        options.parts.push("combat", "gear", "effects");
        break;
    }
  }

  /* -------------------------------------------- */

  _prepareOrderedSkills(skill) {
    return Object.keys(skill)
      .map((key) => ({
        key,
        data: skill[key],
        translated: game.i18n.format(`FADING_SUNS.Skill.${key}`),
      }))
      .sort((a, b) =>
        a.translated > b.translated ? 1 : b.translated > a.translated ? -1 : 0,
      );
  }

  _prepareGroupedCharacteristic(characteristics) {
    return Object.keys(skill)
      .map((key) => ({
        key,
        data: skill[key],
        translated: game.i18n.format(`FADING_SUNS.Skill.${key}`),
      }))
      .sort((a, b) =>
        a.translated > b.translated ? 1 : b.translated > a.translated ? -1 : 0,
      );
  }

  /** @override */
  async _prepareContext(options) {
    // Output initialization
     
    const orderedSkills = this._prepareOrderedSkills(this.actor.system.skills);

    const context = {
      // Validates both permissions and compendium status
      editable: this.isEditable,
      owner: this.isOwner,
      limited: this.document.limited,
      // Add the actor document.
      actor: this.actor,
      // Add the actor's data to context.data for easier access, as well as flags.
      system: {
        ...this.actor.system,
        orderedSkills,
      },
      flags: this.actor.flags,
      // Adding a pointer to CONFIG.FADING_SUNS
      config: CONFIG.FADING_SUNS,
      tabs: this._getTabs(options.parts),
    };

    // Offloading context prep to a helper function
    this._prepareItems(context);

    return context;
  }

  /** @override */
  async _preparePartContext(partId, context) {
    switch (partId) {
      case "features":
      case "combat":
      case "perks":
      case "powers":
      case "gear":
        context.tab = context.tabs[partId];
        break;
      case "biography":
        context.tab = context.tabs[partId];
        // Enrich biography info for display
        // Enrichment turns text like `[[/r 1d20]]` into buttons
        context.enrichedBiography = await TextEditor.enrichHTML(
          this.actor.system.biography,
          {
            // Whether to show secret blocks in the finished html
            secrets: this.document.isOwner,
            // Data to fill in for inline rolls
            rollData: this.actor.getRollData(),
            // Relative UUID resolution
            relativeTo: this.actor,
          },
        );
        break;
      case "effects":
        context.tab = context.tabs[partId];
        // Prepare active effects
        context.effects = createEffectCategories(
          // A generator that returns all effects stored on the actor
          // as well as any items
          this.actor.allApplicableEffects(),
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
    if (!this.tabGroups[tabGroup]) this.tabGroups[tabGroup] = "features";
    return parts.reduce((tabs, partId) => {
      const tab = {
        cssClass: "",
        group: tabGroup,
        // Matches tab property to
        id: "",
        // FontAwesome Icon, if you so choose
        icon: "",
        // Run through localization
        label: "FADING_SUNS.Actor.Tabs.",
      };
      switch (partId) {
        case "header":
        case "tabs":
          return tabs;
        case "biography":
          tab.id = "biography";
          tab.label += "Biography";
          break;
        case "features":
          tab.id = "features";
          tab.label += "Features";
          break;
        case "gear":
          tab.id = "gear";
          tab.label += "Gear";
          break;
        case "combat":
          tab.id = "combat";
          tab.label += "Combat";
          break;
        case "perks":
          tab.id = "perks";
          tab.label += "Perks";
          break;
        case "powers":
          tab.id = "powers";
          tab.label += "Powers";
          break;
        case "effects":
          tab.id = "effects";
          tab.label += "Effects";
          break;
      }
      if (this.tabGroups[tabGroup] === tab.id) tab.cssClass = "active";
      tabs[partId] = tab;
      return tabs;
    }, {});
  }

  /**
   * Organize and classify Items for Actor sheets.
   *
   * @param {object} context The context object to mutate
   */
  _prepareItems(context) {
    // Initialize containers.
    // You can just use `this.document.itemTypes` instead
    // if you don't need to subdivide a given type like
    const armor = [];
    const generic = [];
    const fireArmWeapon = [];
    const statuses = [];

    const meleeWeapon = [];
    const perks = [];
    const upbringings = [];
    const blessings = [];
    const curses = [];
    const competences = [];
    const knowledges = [];
    const powers = [];
    const gear = [];
    const features = [];

    const orderedSkills = this._prepareOrderedSkills(this.actor.system.skills);
    const firearmSkill = orderedSkills.find((s) => s.key === "Shoot");
    const meleeWeaponSkill = orderedSkills.find((s) => s.key === "Melee");

    let theurgy = false;
    let psionics = 0;

    // Iterate through items, allocating to containers
    for (let i of this.document.items) {
      if (i.type === "Armor") {
        armor.push(i);
      }
      if (i.type === "Generic") {
        generic.push(i);
      }
      if (i.type === "FirearmWeapon") {
        fireArmWeapon.push({ ...i, id: i._id, skill: firearmSkill });
      }
      if (i.type === "Status") {
        statuses.push(i);
      }
      if (i.type === "MeleeWeapon") {
        meleeWeapon.push({ ...i, id: i._id, skill: meleeWeaponSkill });
      }
      if (i.type === "Perk") {
        perks.push(i);
      }
      if (i.type === "Upbringing") {
        upbringings.push(i);
      }
      if (i.type === "Blessing") {
        blessings.push(i);
      }
      if (i.type === "Curse") {
        curses.push(i);
      }
      if (i.type === "Competence") {
        competences.push(i);
      }

      if (i.type === "Knowledge") {
        knowledges.push(i);
      }

      if (i.type === "Power") {
        if (i.system.type === "theurgy") theurgy = true;
        if (i.system.type === "psionics") psionics = true;
        powers.push(i);
      }

      // Append to gear.
      if (i.type === "gear") {
        gear.push(i);
      }
      // Append to gear.
      // Append to features.
      else if (i.type === "feature") {
        features.push(i);
      }
    }

    // Sort then assign
    context.generic = generic.sort((a, b) => (a.sort || 0) - (b.sort || 0));
    context.armor = armor.sort((a, b) => (a.sort || 0) - (b.sort || 0));
    context.fireArmWeapon = fireArmWeapon.sort(
      (a, b) => (a.sort || 0) - (b.sort || 0),
    );
    context.meleeWeapon = meleeWeapon.sort(
      (a, b) => (a.sort || 0) - (b.sort || 0),
    );
    context.perks = perks.sort((a, b) =>
      a.name > b.name ? 1 : b.name > a.name ? -1 : 0,
    );
    context.statuses = statuses.sort((a, b) =>
      a.name > b.name ? 1 : b.name > a.name ? -1 : 0,
    );
    context.upbringings = upbringings.sort((a, b) =>
      a.name > b.name ? 1 : b.name > a.name ? -1 : 0,
    );
    context.blessings = blessings.sort((a, b) => (a.sort || 0) - (b.sort || 0));
    context.curses = curses.sort((a, b) => (a.sort || 0) - (b.sort || 0));
    context.competences = competences.sort((a, b) =>
      a.name > b.name ? 1 : b.name > a.name ? -1 : 0,
    );
    context.knowledges = knowledges.sort((a, b) =>
      a.name > b.name ? 1 : b.name > a.name ? -1 : 0,
    );
    context.powers = powers.sort((a, b) =>
      a.name > b.name ? 1 : b.name > a.name ? -1 : 0,
    );
    context.gear = gear.sort((a, b) => (a.sort || 0) - (b.sort || 0));
    context.features = features.sort((a, b) => (a.sort || 0) - (b.sort || 0));
    context.psionics = psionics;
    context.theurgy = theurgy;
  }

  /**
   * Actions performed after any render of the Application.
   * Post-render steps are not awaited by the render process.
   * @param {ApplicationRenderContext} context      Prepared context data
   * @param {RenderOptions} options                 Provided render options
   */
  _onRender(context, options) {
    super._onRender?.(context, options);
    
    // Update species-based attributes when the sheet is opened
    if (options.isFirstRender) {
      updateActorSpeciesAttributes(this.actor);
    }
    
    this.#dragDrop.forEach((d) => d.bind(this.element));
    this.#disableOverrides();
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

  static async _viewJournalEntry(event, target) {
    const journalName = target?.dataset?.journalName;
    if (journalName) {
      const journalEntry = game.journal.getName(journalName);
      if (journalEntry) journalEntry.sheet.render(true);
    }
  }

  static async _viewCharacteristic(event, target) {
    const item = game.items.getName(target.dataset.name);
    if (item) item.sheet.render(true);
  }

  /**

  /**
   * Renders an embedded document's sheet
   *
   * @this FadingSunsActorSheet
   * @param {PointerEvent} event   The originating click event
   * @param {HTMLElement} target   The capturing HTML element which defined a [data-action]
   * @protected
   */
  static async _viewDoc(event, target) {
    const doc = this._getEmbeddedDocument(target);
    doc.sheet.render(true);
  }

  /**
   * Handles item deletion
   *
   * @this FadingSunsActorSheet
   * @param {PointerEvent} event   The originating click event
   * @param {HTMLElement} target   The capturing HTML element which defined a [data-action]
   * @protected
   */
  static async _deleteDoc(event, target) {
    const doc = this._getEmbeddedDocument(target);
    await doc.delete();
  }

  /**
   * Handle creating a new Owned Item or ActiveEffect for the actor using initial data defined in the HTML dataset
   *
   * @this FadingSunsActorSheet
   * @param {PointerEvent} event   The originating click event
   * @param {HTMLElement} target   The capturing HTML element which defined a [data-action]
   * @private
   */
  static async _createDoc(event, target) {
    // Retrieve the configured document class for Item or ActiveEffect
    const docCls = getDocumentClass(target.dataset.documentClass);
    // Prepare the document creation data by initializing it a default name.
    const docData = {
      name: docCls.defaultName({
        // defaultName handles an undefined type gracefully
        type: target.dataset.type,
        parent: this.actor,
      }),
    };
    // Loop through the dataset and add it to our docData
    for (const [dataKey, value] of Object.entries(target.dataset)) {
      // These data attributes are reserved for the action handling
      if (["action", "documentClass"].includes(dataKey)) continue;
      // Nested properties require dot notation in the HTML, e.g. anything with `system`
      // An example exists in spells.hbs, with `data-system.spell-level`
      // which turns into the dataKey 'system.spellLevel'
      foundry.utils.setProperty(docData, dataKey, value);
    }

    // Finally, create the embedded document!
    await docCls.create(docData, { parent: this.actor });
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
    const effect = this._getEmbeddedDocument(target);
    await effect.update({ disabled: !effect.disabled });
  }

  /**
   * Handle clickable rolls.
   *!
   * @this FadingSunsActorSheet
   * @param {PointerEvent} event   The originating click event
   * @param {HTMLElement} target   The capturing HTML element which defined a [data-action]
   * @protected
   */
  static async _onRoll(event, target) {
    const maneuver = new Maneuver(this.actor, target.dataset).render(true);

    //const roll = new RollDice(this.actor, target.dataset).render(true);
  }

  /**
   * Handle clickable rolls on weapons.
   *!
   * @this FadingSunsActorSheet
   * @param {PointerEvent} event   The originating click event
   * @param {HTMLElement} target   The capturing HTML element which defined a [data-action]
   * @protected
   */
  static async _onRollWeapon(event, target) {
    const maneuver = new Maneuver(this.actor, target.dataset, true).render(true);

    //const roll = new RollDice(this.actor, target.dataset).render(true);
  }

  static getMaxBankPointsByLevel(level) {
    switch(level) {
      case 1: return 5;
      case 2: return 10;
      case 3: return 10;
      case 3: return 10;
      case 4: return 15;
      case 5: return 15;
      case 6: return 20;
      case 7: return 20;
      case 8: return 25;
      case 9: return 25;
      case 10: return 30;
    }
    return 5;
  }
  static async _useRevival() {
    this.actor.system.vitality.value +=
      this.actor.system.size.value + this.actor.system.level.value;
    if (this.actor.system.vitality.value > this.actor.system.vitality.max)
      this.actor.system.vitality.value = this.actor.system.vitality.max;

    this.actor.system.revivals.value -= 1;
    await this.actor.update({ system: this.actor.system });
  }

  static async _useVP(evt, target) {
    const vp = Number(target.dataset.vp);
    if (!vp) return;
    if (this.actor.system.bank.victoryPoints < vp) return;
    this.actor.system.bank.victoryPoints -= vp;
    await this.actor.update({ system: this.actor.system });
  }

  static async _useSurge() {
    const c = this.actor.system.characteristics;
    this.actor.system.cache +=
      Math.max(c.str, c.int, c.pre) + this.actor.system.level.value;

    this.actor.system.surge.current -= 1;
    await this.actor.update({ system: this.actor.system });
  }

  /** Helper Functions */

  /**
   * Fetches the embedded document representing the containing HTML element
   *
   * @param {HTMLElement} target    The element subject to search
   * @returns {Item | ActiveEffect} The embedded Item or ActiveEffect
   */
  _getEmbeddedDocument(target) {
    const docRow = target.closest("li[data-document-class]");
    if (docRow.dataset.documentClass === "Item") {
      return this.actor.items.get(docRow.dataset.itemId);
    } else if (docRow.dataset.documentClass === "ActiveEffect") {
      const parent =
        docRow.dataset.parentId === this.actor.id
          ? this.actor
          : this.actor.items.get(docRow?.dataset.parentId);
      return parent.effects.get(docRow?.dataset.effectId);
    } else return console.warn("Could not find document class");
  }

  /***************
   *
   * Drag and Drop
   *
   ***************/

  /**
   * Define whether a user is able to begin a dragstart workflow for a given drag selector
   * @param {string} selector       The candidate HTML selector for dragging
   * @returns {boolean}             Can the current user drag this selector?
   * @protected
   */
  _canDragStart(selector) {
    // game.user fetches the current user
    return this.isEditable;
  }

  /**
   * Define whether a user is able to conclude a drag-and-drop workflow for a given drop selector
   * @param {string} selector       The candidate HTML selector for the drop target
   * @returns {boolean}             Can the current user drop on this selector?
   * @protected
   */
  _canDragDrop(selector) {
    // game.user fetches the current user
    return this.isEditable;
  }

  /**
   * Callback actions which occur at the beginning of a drag start workflow.
   * @param {DragEvent} event       The originating DragEvent
   * @protected
   */
  _onDragStart(event) {
    const docRow = event.currentTarget.closest("li");
    if ("link" in event.target.dataset) return;

    // Chained operation
    let dragData = this._getEmbeddedDocument(docRow)?.toDragData();

    if (!dragData) return;

    // Set data transfer
    event.dataTransfer.setData("text/plain", JSON.stringify(dragData));
  }

  /**
   * Callback actions which occur when a dragged element is over a drop target.
   * @param {DragEvent} event       The originating DragEvent
   * @protected
   */
  _onDragOver(event) {}

  /**
   * Callback actions which occur when a dragged element is dropped on a target.
   * @param {DragEvent} event       The originating DragEvent
   * @protected
   */
  async _onDrop(event) {
    const data = TextEditor.getDragEventData(event);
    const actor = this.actor;
    const allowed = Hooks.call("dropActorSheetData", actor, this, data);
    if (allowed === false) return;

    switch (data.type) {
      case "JournalEntry":
        return this._onDropJournalEntry(event, data);
      case "ActiveEffect":
        return this._onDropActiveEffect(event, data);
      case "Actor":
        return this._onDropActor(event, data);
      case "Item":
        return this._onDropItem(event, data);
      case "Folder":
        return this._onDropFolder(event, data);
    }
  }

  /**
   * Handle the dropping of Jorunal data onto an Actor Sheet
   * @param {DragEvent} event                  The concluding DragEvent which contains drop data
   * @param {object} data                      The data transfer extracted from the event
   * @returns {Promise<ActiveEffect|boolean>}  The created ActiveEffect object or false if it couldn't be created.
   * @protected
   */
  async _onDropJournalEntry(event, data) {
    const item = await JournalEntry.implementation.fromDropData(data);
    const type = item?.flags["monks-enhanced-journal"]?.pagetype;
    let value;
    switch (type) {
      case "place":
        value = this.checkForPlanet(item);
        break;
      case "organization":
        value = this.checkInsideOrganization(item);
        break;
    }

    const result = value.toLowerCase();
    this.actor.system[result] = item.name;

    await this.actor.update({ system: this.actor.system });
  }

  checkForPlanet(item) {
    let placeType;
    item.pages.forEach(
      (page) => (placeType = page.flags["monks-enhanced-journal"].placetype),
    );
    if (placeType.toUpperCase().includes("PLANET")) {
      return "PLANET";
    }
    return false;
  }

  checkInsideOrganization(item) {
    const things = ["CLASS", "FACTION", "CALLING", "SPECIE"];
    let data;
    item.pages.forEach(
      (page) => (data = page.flags["monks-enhanced-journal"].alignment),
    );
    return things.find((th) => data.toUpperCase().includes(th.toUpperCase()));
  }

  /**
   * Handle the dropping of ActiveEffect data onto an Actor Sheet
   * @param {DragEvent} event                  The concluding DragEvent which contains drop data
   * @param {object} data                      The data transfer extracted from the event
   * @returns {Promise<ActiveEffect|boolean>}  The created ActiveEffect object or false if it couldn't be created.
   * @protected
   */
  async _onDropActiveEffect(event, data) {
    const aeCls = getDocumentClass("ActiveEffect");
    const effect = await aeCls.fromDropData(data);
    if (!this.actor.isOwner || !effect) return false;
    if (effect.target === this.actor)
      return this._onSortActiveEffect(event, effect);
    return aeCls.create(effect, { parent: this.actor });
  }

  /**
   * Handle a drop event for an existing embedded Active Effect to sort that Active Effect relative to its siblings
   *
   * @param {DragEvent} event
   * @param {ActiveEffect} effect
   */
  async _onSortActiveEffect(event, effect) {
    /** @type {HTMLElement} */
    const dropTarget = event.target.closest("[data-effect-id]");
    if (!dropTarget) return;
    const target = this._getEmbeddedDocument(dropTarget);

    // Don't sort on yourself
    if (effect.uuid === target.uuid) return;

    // Identify sibling items based on adjacent HTML elements
    const siblings = [];
    for (const el of dropTarget.parentElement.children) {
      const siblingId = el.dataset.effectId;
      const parentId = el.dataset.parentId;
      if (
        siblingId &&
        parentId &&
        (siblingId !== effect.id || parentId !== effect.parent.id)
      )
        siblings.push(this._getEmbeddedDocument(el));
    }

    // Perform the sort
    const sortUpdates = SortingHelpers.performIntegerSort(effect, {
      target,
      siblings,
    });

    // Split the updates up by parent document
    const directUpdates = [];

    const grandchildUpdateData = sortUpdates.reduce((items, u) => {
      const parentId = u.target.parent.id;
      const update = { _id: u.target.id, ...u.update };
      if (parentId === this.actor.id) {
        directUpdates.push(update);
        return items;
      }
      if (items[parentId]) items[parentId].push(update);
      else items[parentId] = [update];
      return items;
    }, {});

    // Effects-on-items updates
    for (const [itemId, updates] of Object.entries(grandchildUpdateData)) {
      await this.actor.items
        .get(itemId)
        .updateEmbeddedDocuments("ActiveEffect", updates);
    }

    // Update on the main actor
    return this.actor.updateEmbeddedDocuments("ActiveEffect", directUpdates);
  }

  /**
   * Handle dropping of an Actor data onto another Actor sheet
   * @param {DragEvent} event            The concluding DragEvent which contains drop data
   * @param {object} data                The data transfer extracted from the event
   * @returns {Promise<object|boolean>}  A data object which describes the result of the drop, or false if the drop was
   *                                     not permitted.
   * @protected
   */
  async _onDropActor(event, data) {
    if (!this.actor.isOwner) return false;
  }

  /* -------------------------------------------- */

  /**
   * Handle dropping of an item reference or item data onto an Actor Sheet
   * @param {DragEvent} event            The concluding DragEvent which contains drop data
   * @param {object} data                The data transfer extracted from the event
   * @returns {Promise<Item[]|boolean>}  The created or updated Item instances, or false if the drop was not permitted.
   * @protected
   */
  async _onDropItem(event, data) {
    if (!this.actor.isOwner) return false;
    const item = await Item.implementation.fromDropData(data);

    // Handle item sorting within the same Actor
    if (this.actor.uuid === item.parent?.uuid)
      return this._onSortItem(event, item);

    // Create the owned item
    return this._onDropItemCreate(item, event);
  }

  /**
   * Handle dropping of a Folder on an Actor Sheet.
   * The core sheet currently supports dropping a Folder of Items to create all items as owned items.
   * @param {DragEvent} event     The concluding DragEvent which contains drop data
   * @param {object} data         The data transfer extracted from the event
   * @returns {Promise<Item[]>}
   * @protected
   */
  async _onDropFolder(event, data) {
    if (!this.actor.isOwner) return [];
    const folder = await Folder.implementation.fromDropData(data);
    if (folder.type !== "Item") return [];
    const droppedItemData = await Promise.all(
      folder.contents.map(async (item) => {
        if (!(document instanceof Item)) item = await fromUuid(item.uuid);
        return item;
      }),
    );
    return this._onDropItemCreate(droppedItemData, event);
  }

  /**
   * Handle the final creation of dropped Item data on the Actor.
   * This method is factored out to allow downstream classes the opportunity to override item creation behavior.
   * @param {object[]|object} itemData      The item data requested for creation
   * @param {DragEvent} event               The concluding DragEvent which provided the drop data
   * @returns {Promise<Item[]>}
   * @private
   */
  async _onDropItemCreate(itemData, event) {
    itemData = itemData instanceof Array ? itemData : [itemData];
    return this.actor.createEmbeddedDocuments("Item", itemData);
  }

  /**
   * Handle a drop event for an existing embedded Item to sort that Item relative to its siblings
   * @param {Event} event
   * @param {Item} item
   * @private
   */
  _onSortItem(event, item) {
    // Get the drag source and drop target
    const items = this.actor.items;
    const dropTarget = event.target.closest("[data-item-id]");
    if (!dropTarget) return;
    const target = items.get(dropTarget.dataset.itemId);

    // Don't sort on yourself
    if (item.id === target.id) return;

    // Identify sibling items based on adjacent HTML elements
    const siblings = [];
    for (let el of dropTarget.parentElement.children) {
      const siblingId = el.dataset.itemId;
      if (siblingId && siblingId !== item.id)
        siblings.push(items.get(el.dataset.itemId));
    }

    // Perform the sort
    const sortUpdates = SortingHelpers.performIntegerSort(item, {
      target,
      siblings,
    });
    const updateData = sortUpdates.map((u) => {
      const update = u.update;
      update._id = u.target._id;
      return update;
    });

    // Perform the update
    return this.actor.updateEmbeddedDocuments("Item", updateData);
  }

  /** The following pieces set up drag handling and are unlikely to need modification  */

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

  /**
   * Create drag-and-drop workflow handlers for this Application
   * @returns {DragDrop[]}     An array of DragDrop handlers
   * @private
   */
  #createDragDropHandlers() {
    return this.options.dragDrop.map((d) => {
      d.permissions = {
        dragstart: this._canDragStart.bind(this),
        drop: this._canDragDrop.bind(this),
      };
      d.callbacks = {
        dragstart: this._onDragStart.bind(this),
        dragover: this._onDragOver.bind(this),
        drop: this._onDrop.bind(this),
      };
      return new DragDrop(d);
    });
  }

  /********************
   *
   * Actor Override Handling
   *
   ********************/

  /**
   * Submit a document update based on the processed form data.
   * @param {SubmitEvent} event                   The originating form submission event
   * @param {HTMLFormElement} form                The form element that was submitted
   * @param {object} submitData                   Processed and validated form data to be used for a document update
   * @returns {Promise<void>}
   * @protected
   * @override
   */
  async _processSubmitData(event, form, submitData) {
    const overrides = foundry.utils.flattenObject(this.actor.overrides);
    for (let k of Object.keys(overrides)) delete submitData[k];
    await this.document.update(submitData);
  }

  /**
   * Disables inputs subject to active effects
   */
  #disableOverrides() {
    const flatOverrides = foundry.utils.flattenObject(this.actor.overrides);
    for (const override of Object.keys(flatOverrides)) {
      const input = this.element.querySelector(`[name="${override}"]`);
      if (input) {
        input.disabled = true;
      }
    }
  }

  /**
   * Handle toggling an armor's equipped status
   * @param {Event} event   The originating click event
   * @param {Object} target The HTML element that was clicked
   * @returns {Promise}
   * @private
   */
  static async _toggleArmor(event, target) {
    event.preventDefault();
    const itemId = target.closest("[data-item-id]")?.dataset.itemId;
    if (!itemId) return;

    const item = this.actor.items.get(itemId);
    if (!item || item.type !== "Armor") return;

    // Get all equipped armors
    const equippedArmors = this.actor.items.filter(i => i.type === "Armor" && i.system.equipped);

    // If this armor is already equipped, unequip it
    if (item.system.equipped) {
      await item.update({ "system.equipped": false });
      
      // Reset body resistance to default (0)
      await this.actor.update({ "system.res.body.value": 0 });
      return;
    }

    // Unequip all other armors first
    for (const armor of equippedArmors) {
      await armor.update({ "system.equipped": false });
    }

    // Equip this armor
    await item.update({ "system.equipped": true });

    // Update body resistance to match armor's body resistance
    await this.actor.update({ "system.res.body.value": item.system.BodyResistance });
  }

  /**
   * Opens the predefined effects dialog
   * @param {PointerEvent} event   The originating click event
   * @param {HTMLElement} target   The capturing HTML element which defined a [data-action]
   * @returns {Promise}
   * @static
   */
  static async _openPredefinedEffectsDialog(event, target) {
    event.preventDefault();
    const dialog = new PredefinedEffectsDialog(this.actor);
    dialog.render(true);
  }

  /** @override */
  activateListeners(html) {
    super.activateListeners(html);

    // Everything below here is only needed if the sheet is editable
    if (!this.isEditable) return;

    // Add Inventory Item
    html.find('.item-create').click(this._onItemCreate.bind(this));

    // Update Inventory Item
    html.find('.item-edit').click(ev => {
      const li = $(ev.currentTarget).parents(".item");
      const item = this.actor.items.get(li.data("itemId"));
      item.sheet.render(true);
    });

    // Delete Inventory Item
    html.find('.item-delete').click(ev => {
      const li = $(ev.currentTarget).parents(".item");
      const item = this.actor.items.get(li.data("itemId"));
      item.delete();
      li.slideUp(200, () => this.render(false));
    });

    // We're removing the effect control handling from here as it's now handled by actions
  }
}
