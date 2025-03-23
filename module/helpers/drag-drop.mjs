/**
 * Helper functions for drag and drop functionality
 */

/**
 * Create drag-and-drop workflow handlers for an Application
 * @param {Object} app - The application instance
 * @param {Array} dragDropOptions - The drag drop options from the application
 * @returns {DragDrop[]} An array of DragDrop handlers
 */
export function createDragDropHandlers(app, dragDropOptions) {
  return dragDropOptions.map((d) => {
    d.permissions = {
      dragstart: canDragStart.bind(app),
      drop: canDragDrop.bind(app),
    };
    d.callbacks = {
      dragstart: onDragStart.bind(app),
      dragover: onDragOver.bind(app),
      drop: onDrop.bind(app),
    };
    return new DragDrop(d);
  });
}

/**
 * Define whether a user is able to begin a dragstart workflow for a given drag selector
 * @param {string} selector - The candidate HTML selector for dragging
 * @returns {boolean} - Can the current user drag this selector?
 */
function canDragStart(selector) {
  return this.isEditable;
}

/**
 * Define whether a user is able to conclude a drag-and-drop workflow for a given drop selector
 * @param {string} selector - The candidate HTML selector for the drop target
 * @returns {boolean} - Can the current user drop on this selector?
 */
function canDragDrop(selector) {
  return this.isEditable;
}

/**
 * Callback actions which occur at the beginning of a drag start workflow.
 * @param {DragEvent} event - The originating DragEvent
 */
function onDragStart(event) {
  const li = event.currentTarget;
  if ("link" in event.target.dataset) return;

  let dragData = null;

  // Active Effect
  if (li.dataset.effectId) {
    const effect = this.item.effects.get(li.dataset.effectId);
    dragData = effect.toDragData();
  }

  if (!dragData) return;

  // Set data transfer
  event.dataTransfer.setData("text/plain", JSON.stringify(dragData));
}

/**
 * Callback actions which occur when a dragged element is over a drop target.
 * @param {DragEvent} event - The originating DragEvent
 */
function onDragOver(event) {
  // Default implementation is empty
}

/**
 * Callback actions which occur when a dragged element is dropped on a target.
 * @param {DragEvent} event - The originating DragEvent
 */
async function onDrop(event) {
  const data = TextEditor.getDragEventData(event);
  const item = this.item;
  const allowed = Hooks.call("dropItemSheetData", item, this, data);
  if (allowed === false) return;

  // Handle different data types
  switch (data.type) {
    case "ActiveEffect":
      return onDropActiveEffect.call(this, event, data);
    case "Actor":
      return onDropActor.call(this, event, data);
    case "Item":
      return onDropItem.call(this, event, data);
    case "Folder":
      return onDropFolder.call(this, event, data);
  }
}

/**
 * Handle the dropping of ActiveEffect data onto an Actor Sheet
 * @param {DragEvent} event - The concluding DragEvent which contains drop data
 * @param {object} data - The data transfer extracted from the event
 * @returns {Promise<ActiveEffect|boolean>} The created ActiveEffect object or false if it couldn't be created.
 */
async function onDropActiveEffect(event, data) {
  const aeCls = getDocumentClass("ActiveEffect");
  const effect = await aeCls.fromDropData(data);
  if (!this.item.isOwner || !effect) return false;

  if (this.item.uuid === effect.parent?.uuid)
    return onEffectSort.call(this, event, effect);
  return aeCls.create(effect, { parent: this.item });
}

/**
 * Sorts an Active Effect based on its surrounding attributes
 * @param {DragEvent} event - The drag event
 * @param {ActiveEffect} effect - The effect being sorted
 */
function onEffectSort(event, effect) {
  const effects = this.item.effects;
  const dropTarget = event.target.closest("[data-effect-id]");
  if (!dropTarget) return;
  const target = effects.get(dropTarget.dataset.effectId);

  // Don't sort on yourself
  if (effect.id === target.id) return;

  // Identify sibling items based on adjacent HTML elements
  const siblings = [];
  for (let el of dropTarget.parentElement.children) {
    const siblingId = el.dataset.effectId;
    if (siblingId && siblingId !== effect.id)
      siblings.push(effects.get(el.dataset.effectId));
  }

  // Perform the sort
  const sortUpdates = SortingHelpers.performIntegerSort(effect, {
    target,
    siblings,
  });
  const updateData = sortUpdates.map((u) => {
    const update = u.update;
    update._id = u.target._id;
    return update;
  });

  // Perform the update
  return this.item.updateEmbeddedDocuments("ActiveEffect", updateData);
}

/**
 * Handle dropping of an Actor data onto another Actor sheet
 * @param {DragEvent} event - The concluding DragEvent which contains drop data
 * @param {object} data - The data transfer extracted from the event
 * @returns {Promise<object|boolean>} A data object which describes the result of the drop, or false if the drop was not permitted.
 */
async function onDropActor(event, data) {
  if (!this.item.isOwner) return false;
  // Default implementation is empty
}

/**
 * Handle dropping of an item reference or item data onto an Actor Sheet
 * @param {DragEvent} event - The concluding DragEvent which contains drop data
 * @param {object} data - The data transfer extracted from the event
 * @returns {Promise<Item[]|boolean>} The created or updated Item instances, or false if the drop was not permitted.
 */
async function onDropItem(event, data) {
  if (!this.item.isOwner) return false;
  // Default implementation is empty
}

/**
 * Handle dropping of a Folder on an Actor Sheet.
 * @param {DragEvent} event - The concluding DragEvent which contains drop data
 * @param {object} data - The data transfer extracted from the event
 * @returns {Promise<Item[]>}
 */
async function onDropFolder(event, data) {
  if (!this.item.isOwner) return [];
  // Default implementation is empty
}

/**
 * Fetches the row with the data for the rendered embedded document
 * @param {HTMLElement} target - The element with the action
 * @returns {ActiveEffect} The document's effect
 */
export function getEffect(target) {
  const li = target.closest(".effect");
  return this.item.effects.get(li?.dataset?.effectId);
}

/**
 * Register drag-drop handlers for all sheets
 */
export function registerSheets() {
  // Register drag-drop handlers for actor sheets
  Hooks.on("renderActorSheet", (app, html, data) => {
    const dragDropOptions = {
      dragSelector: ".item-list .item",
      dropSelector: ".sheet-body",
      permissions: { dragStart: true, drop: true },
      callbacks: {
        dragStart: (event) => {
          const dataset = event.currentTarget.dataset;
          const item = app.actor.items.get(dataset.itemId);
          event.dataTransfer.setData(
            "text/plain",
            JSON.stringify({
              type: "Item",
              uuid: item.uuid,
              data: item
            })
          );
        },
        drop: async (event) => {
          const data = JSON.parse(event.dataTransfer.getData("text/plain"));
          if (data.type === "Item") {
            // Handle item drops
            let item = null;
            if (data.uuid) {
              item = await fromUuid(data.uuid);
            } else if (data.data) {
              item = data.data;
            }
            if (item) {
              return app.actor.createEmbeddedDocuments("Item", [item]);
            }
          } else if (data.type === "ActiveEffect") {
            // Handle effect drops
            const effect = getEffect(event.target);
            if (effect) {
              return app.actor.createEmbeddedDocuments("ActiveEffect", [effect]);
            }
          }
        }
      }
    };
    createDragDropHandlers(app, dragDropOptions);
  });

  // Register drag-drop handlers for item sheets
  Hooks.on("renderItemSheet", (app, html, data) => {
    const dragDropOptions = {
      dragSelector: ".effect-list .effect",
      dropSelector: ".sheet-body",
      permissions: { dragStart: true, drop: true },
      callbacks: {
        dragStart: (event) => {
          const dataset = event.currentTarget.dataset;
          const effect = app.item.effects.get(dataset.effectId);
          event.dataTransfer.setData(
            "text/plain",
            JSON.stringify({
              type: "ActiveEffect",
              uuid: effect.uuid,
              data: effect
            })
          );
        },
        drop: async (event) => {
          const data = JSON.parse(event.dataTransfer.getData("text/plain"));
          if (data.type === "ActiveEffect") {
            const effect = getEffect(event.target);
            if (effect) {
              return app.item.createEmbeddedDocuments("ActiveEffect", [effect]);
            }
          }
        }
      }
    };
    createDragDropHandlers(app, dragDropOptions);
  });
} 