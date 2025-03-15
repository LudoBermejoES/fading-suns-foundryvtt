/**
 * @typedef {Object} ActiveEffect
 * @property {string} icon - The FontAwesome icon name for the effect
 * @property {string} type - The type of effect (físico, mental, social)
 * @property {string} title - The display name of the effect
 * @property {string} description - A detailed description of the effect
 */

/**
 * Effect types
 * @enum {string}
 */
export const EFFECT_TYPES = {
  PHYSICAL: 'físico',
  MENTAL: 'mental',
  SOCIAL: 'social'
};

/**
 * A collection of predefined active effects for the Fading Suns system
 * @type {ActiveEffect[]}
 */
const effectsList = [
   {
      "icon":"meh-o",
      "type": EFFECT_TYPES.PHYSICAL,
      "title":"ATONTADO",
      "description":"No estás en plena forma: sufres un penalizador de –2 a la meta de tus tiradas relacionadas con la Percepción y a tus ataques físicos."
   },
   {
      "icon":"frown-o",
      "type": EFFECT_TYPES.PHYSICAL,
      "title":"ATORMENTADO",
      "description":"Sientes un dolor terrible. Sufres un penalizador de –2 a todas tus acciones físicas. Además, cuando gastes PV, debes gastar 1 PV adicional como «penalización por el dolor»."
   },
   {
      "icon":"dizzy",
      "type": EFFECT_TYPES.PHYSICAL,
      "title":"ATURDIDO",
      "description":"Tu coordinación ha sufrido un revés. Las tiradas relacionadas con acciones físicas y percepción son desfavorables."
   },
   {
      "icon":"ear",
      "type": EFFECT_TYPES.PHYSICAL,
      "title":"AUDICIÓN REDUCIDA",
      "description":"Tienes problemas para oír. Sufres un penalizador de –2 a la meta de cualquier actividad o tirada de percepción que requiera oír. Ganas Resistencia +2 a los ataques sónicos."
   },
   {
      "icon":"bed",
      "type": EFFECT_TYPES.PHYSICAL,
      "title":"CANSADO",
      "description":"Te sientes muy débil. Sufres un penalizador de –2 a todas las acciones físicas. También debes gastar 1 PV para realizar cualquier acción que requiera una tirada."
   },
   {
      "icon":"eye-slash",
      "type": EFFECT_TYPES.PHYSICAL,
      "title":"CEGADO",
      "description":"No puedes ver. Todas tus tiradas físicas contra alguien a quien no estés tocando directamente son desfavorables. Los ataques físicos de los demás contra ti son favorables."
   },
   {
      "icon":"compass",
      "type": EFFECT_TYPES.PHYSICAL,
      "title":"DESORIENTADO",
      "description":"Tu percepción se ha visto afectada. Tus acciones se dirigen contra objetivos aleatorios en vez de contra tu objetivo."
   },
   {
      "icon":"volume-off",
      "type": EFFECT_TYPES.PHYSICAL,
      "title":"ENSORDECIDO",
      "description":"No puedes oír. Las actividades que requieren audición te son imposibles. Los ataques sónicos son desfavorables contra ti."
   },
   {
      "icon":"bolt",
      "type": EFFECT_TYPES.MENTAL,
      "title":"ESTIMULADO",
      "description":"Eres extremadamente consciente de lo que te rodea. Ganas ventaja de iniciativa y un bonificador de +2 a la Percepción."
   },
   {
      "icon":"smile-o",
      "type": EFFECT_TYPES.MENTAL,
      "title":"EUFÓRICO",
      "description":"Te invade el placer. Eres el último en el orden de iniciativa y sufres un penalizador de –2 a la meta de todas tus tiradas."
   },
   {
      "icon":"cloud",
      "type": EFFECT_TYPES.PHYSICAL,
      "title":"FLOTANDO",
      "description":"Estás flotando en el aire. Las tiradas de acciones físicas son desfavorables a menos que tengas la competencia adecuada."
   },
   {
      "icon":"wheelchair",
      "type": EFFECT_TYPES.PHYSICAL,
      "title":"INCAPACITADO",
      "description":"No puedes iniciar ninguna acción que requiera tirada ni reaccionar a las acciones de los demás."
   },
   {
      "icon":"user-slash",
      "type": EFFECT_TYPES.MENTAL,
      "title":"INCONSCIENTE",
      "description":"Te caes, quedas Tumbado y dejas de darte cuenta de lo que ocurre. Los ataques físicos contra ti son favorables."
   },
   {
      "icon":"lock",
      "type": EFFECT_TYPES.PHYSICAL,
      "title":"INMOVILIZADO",
      "description":"No te puedes mover. Todas las acciones que impliquen el movimiento de todo tu cuerpo son desfavorables."
   },
   {
      "icon":"heart-o",
      "type": EFFECT_TYPES.PHYSICAL,
      "title":"INSENSIBILIZADO",
      "description":"Has quedado apático. Eres inmune a estados relacionados con el dolor mientras dure este estado."
   },
   {
      "icon":"skull",
      "type": EFFECT_TYPES.PHYSICAL,
      "title":"MORIBUNDO",
      "description":"Estás agonizando. Si no recibes ayuda médica antes del final de la escena, morirás."
   },
   {
      "icon":"band-aid",
      "type": EFFECT_TYPES.PHYSICAL,
      "title":"MALHERIDO",
      "description":"Has sufrido una herida que requiere cirugía antes de poder sanar. Necesitas cuidados médicos o un elixir para sanar."
   },
   {
      "icon":"spinner",
      "type": EFFECT_TYPES.PHYSICAL,
      "title":"MAREADO",
      "description":"Tienes náuseas. Sufres un penalizador de –2 a todas tus tiradas. Si sufres un ataque fuerte, podrías vomitar y perder tu próxima acción."
   },
   {
      "icon":"ban",
      "type": EFFECT_TYPES.PHYSICAL,
      "title":"OBSTACULIZADO",
      "description":"Tus movimientos están limitados. Solo puedes moverte a la mitad de tu velocidad normal y sufres un penalizador de –2 a la meta de acciones que impliquen movimiento."
   },
   {
      "icon":"stop",
      "type": EFFECT_TYPES.PHYSICAL,
      "title":"PARALIZADO",
      "description":"No puedes mover ninguna parte de tu cuerpo. Las acciones de influencia que requieren algo más que un susurro son desfavorables."
   },
   {
      "icon":"bed",
      "type": EFFECT_TYPES.PHYSICAL,
      "title":"TUMBADO",
      "description":"Estás tirado en el suelo. Debes utilizar tu acción de movimiento para levantarte o gatear."
   },
   {
      "icon":"eye",
      "type": EFFECT_TYPES.PHYSICAL,
      "title":"VISIÓN REDUCIDA",
      "description":"No ves bien. Sufres un penalizador de –2 a todas tus tiradas físicas contra alguien a quien no estés tocando directamente."
   },
   {
      "icon":"exclamation-triangle",
      "type": EFFECT_TYPES.MENTAL,
      "title":"ANSIOSO",
      "description":"Estás muy alterado. Sufres un penalizador de –2 a tus intentos de influencia y a tareas a largo plazo que requieran concentración."
   },
   {
      "icon":"bug",
      "type": EFFECT_TYPES.MENTAL,
      "title":"ASUSTADO",
      "description":"Te sientes amenazado. Sufres un penalizador de –2 a cualquier acción excepto percepción y eludir."
   },
   {
      "icon":"ghost",
      "type": EFFECT_TYPES.MENTAL,
      "title":"ATERRORIZADO",
      "description":"Temes por tu vida. Debes huir de lo que te asusta o te acurrucarás, incapaz de realizar cualquier acción ofensiva."
   },
   {
      "icon":"fighter-jet",
      "type": EFFECT_TYPES.MENTAL,
      "title":"BERSERK",
      "description":"Atacarás físicamente sin piedad. Después de que termine el estado, quedarás exhausto."
   },
   {
      "icon":"question",
      "type": EFFECT_TYPES.MENTAL,
      "title":"CONFUSO",
      "description":"No estás seguro de lo que creer. Sufres un penalizador de –2 a todas las acciones que no sean físicas."
   },
   {
      "icon":"laugh-beam",
      "type": EFFECT_TYPES.MENTAL,
      "title":"DIVERTIDO",
      "description":"Desbordas de alegría. Tus intentos de persuasión son favorables, pero los de coacción son desfavorables."
   },
   {
      "icon":"angry",
      "type": EFFECT_TYPES.MENTAL,
      "title":"ENFADADO",
      "description":"Estás irascible. Cualquier maniobra de influencia que intentes será desfavorable, pero tus intentos de coacción serán favorables."
   },
   {
      "icon":"grin-stars",
      "type": EFFECT_TYPES.MENTAL,
      "title":"ENTUSIASMADO",
      "description":"Te sientes optimista y listo para el desafío. Ganas un bonificador de +2 a la meta de tus tiradas en tareas prolongadas."
   },
   {
      "icon":"flag",
      "type": EFFECT_TYPES.MENTAL,
      "title":"PENALIZADO",
      "description":"Has sido rechazado o has recibido una paliza. Sufres un penalizador de –2 a todas tus tiradas mientras el estado permanezca activo."
   },
   {
      "icon":"user-secret",
      "type": EFFECT_TYPES.MENTAL,
      "title":"SUPLANTADO",
      "description":"Alguien más ocupa tu puesto. Ver a esa persona te distrae, causando un penalizador de –2 a todas tus tiradas."
   },
   {
      "icon":"bolt",
      "type": EFFECT_TYPES.MENTAL,
      "title":"TEMERARIO",
      "description":"Eres descuidado y tienes una fe ciega en que tu causa triunfará. Las tiradas de todas tus acciones no ofensivas son desfavorables."
   },
   {
      "icon":"user-secret",
      "type": EFFECT_TYPES.MENTAL,
      "title":"ENGAÑADO",
      "description":"Te han engañado y no te has dado cuenta. Crees que la persona que te ha impuesto el estado está diciendo la verdad, siempre que sean cosas plausibles. Las tiradas de persuasión contra ti son favorables mientras permanezcas en este estado."
   },
   {
      "icon":"lightbulb-o",
      "type": EFFECT_TYPES.MENTAL,
      "title":"ILUMINADO",
      "description":"Estás experimentando un plano superior de la realidad. Tus tiradas de arrepentirse, reconciliar y expiar el Ansia psíquica y la Hubris teúrgica son favorables."
   },
   {
      "icon":"check-circle",
      "type": EFFECT_TYPES.MENTAL,
      "title":"OBEDIENTE",
      "description":"Te han dado una orden y debes obedecerla, aunque no te guste. Si la orden perjudica los objetivos de tu facción, puedes hacer una tirada refleja cada turno para intentar desobedecerla."
   },
   {
      "icon":"flag",
      "type": EFFECT_TYPES.PHYSICAL,
      "title":"PENALIZADO",
      "description":"Antes de hacer cualquier tirada, lanza una moneda. Si sale cara, la tirada es desfavorable. Alternativamente, puedes lanzar 1d20; 1-10 = normal y 11-20 = desfavorable."
   },
   {
      "icon":"handshake-o",
      "type": EFFECT_TYPES.SOCIAL,
      "title":"AMIGADO",
      "description":"Tu influenciador te cae bien. Si eras hostil, ahora eres neutral; si eras neutral, ahora eres amistoso; y si eras amistoso, ahora eres un aliado leal. Estarás inclinado a hacer pequeños favores por esta persona."
   },
   {
      "icon":"surprise",
      "type": EFFECT_TYPES.MENTAL,
      "title":"ATÓNITO",
      "description":"Has descubierto algo repentinamente. Esto puede ser un misterio resuelto o un nuevo objetivo. La persona que te provocó el estado gana tu respeto y sus intentos de influencia son favorables."
   },
   {
      "icon":"heart",
      "type": EFFECT_TYPES.MENTAL,
      "title":"CAUTIVADO",
      "description":"Estás fascinado por tu influenciador o su espectáculo. Te resulta difícil concentrarte en otra cosa y las tiradas para otras acciones podrían ser desfavorables o requerir el pago de 1 PV."
   },
   {
      "icon":"thumbs-up",
      "type": EFFECT_TYPES.MENTAL,
      "title":"CONVENCIDO",
      "description":"Has adoptado la creencia, idea o plan de tu influenciador, convirtiéndolo en parte de ti. Si el estado se vuelve crónico, querrás difundir la idea y convencer a tus amigos y aliados."
   },
   {
      "icon":"gavel",
      "type": EFFECT_TYPES.MENTAL,
      "title":"CULPABLE",
      "description":"Te sientes culpable por algo que has hecho. Sufres un penalizador de –2 a todas tus tiradas contra la persona que te ha impuesto el estado."
   },
   {
      "icon":"thumbs-down",
      "type": EFFECT_TYPES.MENTAL,
      "title":"DESANIMADO",
      "description":"Has perdido la confianza en ti mismo. Sufres un penalizador de –2 a todas tus tiradas."
   },
   {
      "icon":"heart-broken",
      "type": EFFECT_TYPES.MENTAL,
      "title":"DESCORAZONADO",
      "description":"Has perdido la esperanza. Sufres un penalizador de –2 a todas tus tiradas y no puedes gastar PV."
   },
   {
      "icon":"user-times",
      "type": EFFECT_TYPES.SOCIAL,
      "title":"ENEMISTADO",
      "description":"Tu influenciador te cae mal. Si eras amistoso, ahora eres neutral; si eras neutral, ahora eres hostil; y si eras hostil, ahora eres un enemigo jurado. Estarás inclinado a hacer pequeños actos de sabotaje contra esta persona."
   },
   {
      "icon":"hand-paper-o",
      "type": EFFECT_TYPES.MENTAL,
      "title":"IMPRESIONADO",
      "description":"Estás impresionado por tu influenciador. Sufres un penalizador de –2 a tus tiradas de influencia contra él."
   },
   {
      "icon":"meh-rolling-eyes",
      "type": EFFECT_TYPES.MENTAL,
      "title":"INCRÉDULO",
      "description":"No crees lo que te están diciendo. Ganas un bonificador de +2 a tus tiradas de resistencia contra la influencia de la persona que te ha impuesto el estado."
   },
   {
      "icon":"angry",
      "type": EFFECT_TYPES.MENTAL,
      "title":"INDIGNADO",
      "description":"Estás enfadado por algo que ha hecho tu influenciador. Sufres un penalizador de –2 a tus tiradas de influencia contra él, excepto las de coacción."
   },
   {
      "icon":"hand-peace-o",
      "type": EFFECT_TYPES.MENTAL,
      "title":"PACIFICADO",
      "description":"Te sientes en paz. No puedes realizar acciones ofensivas contra la persona que te ha impuesto el estado."
   },
   {
      "icon":"smile-beam",
      "type": EFFECT_TYPES.MENTAL,
      "title":"SATISFECHO",
      "description":"Te sientes bien contigo mismo. Ganas un bonificador de +2 a tus tiradas de influencia."
   }
];

// Note: The utility functions for retrieving effects have been moved to module/helpers/effects.mjs

export default effectsList;
