// Variables globales
let gameMode = null; // 'pvp', 'pve', 'story'
let turn = 1; // 1 o 2 (Jugador 1 o 2/IA)
let player1, player2;
let activePokemon1, activePokemon2;
let isPlayerTurn = true;
let logArea = null;
let moveButtons = null;
let btnBackToMenu = null;
let turnIndicator = null;
let battleDiv = null;
let menuDiv = null;
let audioBg, audioAttack, audioHit, audioMiss, audioCritical, audioVictory, audioStatus, audioSelect;
let disableInput = false;

// Para animar texto como máquina de escribir
function typeWriter(text, element, speed = 40, callback = null) {
  element.innerHTML = "";
  let i = 0;
  function typing() {
    if (i < text.length) {
      element.innerHTML += text.charAt(i);
      i++;
      setTimeout(typing, speed);
    } else {
      if (callback) callback();
    }
  }
  typing();
}

// Función para cargar el Pokémon y preparar stats
function preparePokemon(pkmData) {
  return {
    ...pkmData,
    currentHP: pkmData.maxHP,
    status: null,
    pp: pkmData.moves.map(moveId => {
      let move = movesList.find(m => m.id === moveId);
      return { ...move, currentPP: move.ppMax };
    }),
    exp: 0,
    sleepTurns: 0,
  };
}

function setHPBar(pokemon, hpBarElement, hpTextElement) {
  const hpPercent = (pokemon.currentHP / pokemon.maxHP) * 100;
  hpBarElement.style.width = `${hpPercent}%`;

  // Cambiar color según %HP
  if (hpPercent > 60) hpBarElement.style.background = 'linear-gradient(90deg, #76ff03, #33691e)';
  else if (hpPercent > 30) hpBarElement.style.background = 'linear-gradient(90deg, #ffeb3b, #fbc02d)';
  else hpBarElement.style.background = 'linear-gradient(90deg, #f44336, #b71c1c)';

  hpTextElement.textContent = `${pokemon.currentHP} / ${pokemon.maxHP}`;
}

function showStatus(pokemon, statusElement) {
  if (!pokemon.status) {
    statusElement.textContent = "";
    statusElement.style.color = "#fff";
  } else {
    const statusInfo = statusEffects[pokemon.status];
    statusElement.textContent = statusInfo.name;
    statusElement.style.color = statusInfo.color;
  }
}

function showLevel(pokemon, levelElement) {
  levelElement.textContent = `Nivel: ${pokemon.level}`;
}

function renderPP(pokemon, container) {
  container.innerHTML = "";
  pokemon.pp.forEach((move, idx) => {
    const ppBar = document.createElement("div");
    ppBar.classList.add("pp-bar");
    if (move.currentPP <= 0) ppBar.classList.add("used");
    ppBar.title = `${move.name} PP: ${move.currentPP}/${move.ppMax}`;
    container.appendChild(ppBar);
  });
}

function updateUI() {
  // Jugador 1 UI
  document.getElementById("nameP1").textContent = activePokemon1.name;
  document.getElementById("spriteP1").src = activePokemon1.spriteBack;
  setHPBar(activePokemon1, document.getElementById("hpBarP1"), document.getElementById("hpTextP1"));
  showStatus(activePokemon1, document.getElementById("statusP1"));
  showLevel(activePokemon1, document.getElementById("levelP1"));
  renderPP(activePokemon1, document.getElementById("ppContainerP1"));

  // Jugador 2 UI
  document.getElementById("nameP2").textContent = activePokemon2.name;
  document.getElementById("spriteP2").src = activePokemon2.spriteFront;
  setHPBar(activePokemon2, document.getElementById("hpBarP2"), document.getElementById("hpTextP2"));
  showStatus(activePokemon2, document.getElementById("statusP2"));
  showLevel(activePokemon2, document.getElementById("levelP2"));
  renderPP(activePokemon2, document.getElementById("ppContainerP2"));

  // Mostrar botones de movimientos del jugador activo
  if (isPlayerTurn) {
    moveButtons.forEach((btn, idx) => {
      const move = activePokemon1.pp[idx];
      btn.textContent = `${move.name} (PP: ${move.currentPP})`;
      btn.disabled = move.currentPP <= 0 || disableInput;
      btn.style.visibility = "visible";
    });
  } else {
    moveButtons.forEach(btn => btn.style.visibility = "hidden");
  }
}

function applyStatusEffect(pokemon) {
  if (!pokemon.status) return null;
  const effectText = statusEffects[pokemon.status].effect(pokemon);
  if (effectText) return effectText;
  return null;
}

function calculateDamage(attacker, defender, move) {
  if (move.power === 0) return 0; // Ataques sin daño (ejemplo: descanso)

  // Base damage formula simplificada
  const levelFactor = (2 * attacker.level) / 5 + 2;
  const attackStat = attacker.attack;
  const defenseStat = defender.defense;
  const baseDamage = Math.floor(((levelFactor * move.power * (attackStat / defenseStat)) / 50) + 2);

  // Efectividad tipo
  const defenderTypes = defender.types || [];
  let effectiveness = 1;
  defenderTypes.forEach(type => {
    if (typeChart[move.type] && typeChart[move.type][type] !== undefined) {
      effectiveness *= typeChart[move.type][type];
    }
  });

  return Math.floor(baseDamage * effectiveness);
}

function getEffectivenessMessage(effectiveness) {
  if (effectiveness > 1) return "¡Es súper efectivo!";
  else if (effectiveness === 0) return "No afecta...";
  else if (effectiveness < 1) return "No es muy efectivo...";
  else return "";
}

function performAttack(attacker, defender, move, callback) {
  if (disableInput) return;

  disableInput = true;
  let messages = [];

  // Verificar si ataque falla
  const hitRoll = Math.random() * 100;
  if (hitRoll > move.accuracy) {
    messages.push(`${attacker.name} usó ${move.name} pero falló.`);
    audioMiss.play();
    callback(messages);
    disableInput = false;
    return;
  }

  // PP decrement
  const movePP = attacker.pp.find(m => m.id === move.id);
  if (!movePP || movePP.currentPP <= 0) {
    messages.push(`${move.name} no tiene PP.`);
    callback(messages);
    disableInput = false;
    return;
  }
  movePP.currentPP--;

  // Calcular daño
  const damage = calculateDamage(attacker, defender, move);
  defender.currentHP = Math.max(defender.currentHP - damage, 0);

  // Mensajes de daño y efectividad
  let effectiveness = 1;
  if (defender.types) {
    defender.types.forEach(type => {
      if (typeChart[move.type] && typeChart[move.type][type] !== undefined) {
        effectiveness *= typeChart[move.type][type];
      }
    });
  }
  const effectMsg = getEffectivenessMessage(effectiveness);

  // Golpe crítico
  let isCritical = false;
  if (Math.random() < 0.1) {
    isCritical = true;
    defender.currentHP = Math.max(defender.currentHP - damage, 0); // Daño extra igual al daño calculado
    messages.push("¡Golpe crítico!");
    audioCritical.play();
  }

  // Aplicar estado alterado si corresponde
  if (move.status && defender.status === null) {
    if (Math.random() < 0.3) { // 30% de chance de causar el estado
      defender.status = move.status;
      messages.push(`${defender.name} está ${statusEffects[move.status].name.toLowerCase()}!`);
      audioStatus.play();
    }
  }

  // Mensajes
  messages.unshift(`${attacker.name} usó ${move.name}!`);
  if (damage > 0) messages.push(`${defender.name} recibe ${damage} puntos de daño.`);
  if (effectMsg) messages.push(effectMsg);

  audioAttack.play();

  setTimeout(() => {
    updateUI();
    callback(messages);
    disableInput = false;
  }, 1000);
}

// Funcion para avanzar el turno (cambio de turno entre jugador y enemigo)
function nextTurn() {
  // Aplicar efectos de estado al inicio del turno
  let statusMsg1 = applyStatusEffect(activePokemon1);
  let statusMsg2 = applyStatusEffect(activePokemon2);

  if (statusMsg1) typeWriter(statusMsg1, logArea, 30, () => {});
  if (statusMsg2) typeWriter(statusMsg2, logArea, 30, () => {});

  if (activePokemon1.currentHP <= 0 || activePokemon2.currentHP <= 0) {
    endBattle();
    return;
  }

  turn = turn === 1 ? 2 : 1;
  isPlayerTurn = (turn === 1);

  updateUI();

  if (!isPlayerTurn) {
    // Turno IA (elige ataque aleatorio con PP)
    const availableMoves = activePokemon2.pp.filter(m => m.currentPP > 0);
    if (availableMoves.length === 0) {
      // Si no hay PP, usar ataque básico
      performAttack(activePokemon2, activePokemon1, movesList[1], (msgs) => {
        nextTurn();
      });
    } else {
      const move = availableMoves[Math.floor(Math.random() * availableMoves.length)];
      performAttack(activePokemon2, activePokemon1, move, (msgs) => {
        // Mostrar mensajes con máquina de escribir y luego nextTurn
        typeWriter(msgs.join("\n"), logArea, 30, () => {
          nextTurn();
        });
      });
    }
  }
}

function endBattle() {
  if (activePokemon1.currentHP <= 0) {
    typeWriter(`${activePokemon1.name} se debilitó. ¡Perdiste!`, logArea);
  } else if (activePokemon2.currentHP <= 0) {
    typeWriter(`${activePokemon2.name} se debilitó. ¡Ganaste!`, logArea);
  }
  disableInput = true;
  moveButtons.forEach(btn => btn.disabled = true);
}

// Inicialización y evento botones de ataque
function setupBattle() {
  activePokemon1 = preparePokemon(pokemons[0]);
  activePokemon2 = preparePokemon(pokemons[1]);

  updateUI();
  disableInput = false;

  moveButtons.forEach(btn => {
    btn.addEventListener("click", () => {
      if (disableInput) return;
      const idx = parseInt(btn.dataset.idx);
      const move = activePokemon1.pp[idx];
      performAttack(activePokemon1, activePokemon2, move, (msgs) => {
        typeWriter(msgs.join("\n"), logArea, 30, () => {
          if (activePokemon2.currentHP <= 0) {
            endBattle();
          } else {
            nextTurn();
          }
        });
      });
    });
  });
}

// Evento DOMContentLoaded para iniciar
document.addEventListener("DOMContentLoaded", () => {
  logArea = document.getElementById("battleLog");
  moveButtons = Array.from(document.querySelectorAll(".move-button"));

  setupBattle();
});
