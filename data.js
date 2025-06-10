// Data principal Pokémon + moves + bosses + estados

const pokemonList = [
    {
      id: 25,
      name: "Pikachu",
      types: ["Electric"],
      maxHP: 120,
      attack: 55,
      defense: 40,
      speed: 90,
      level: 10,
      spriteFront: "assets/sprites/pikachu_front.png",
      spriteBack: "assets/sprites/pikachu_back.png",
      moves: [ // id referenciados a movesList
        1, 2, 3, 4
      ]
    },
    {
      id: 4,
      name: "Charmander",
      types: ["Fire"],
      maxHP: 115,
      attack: 52,
      defense: 43,
      speed: 65,
      level: 10,
      spriteFront: "assets/sprites/charmander_front.png",
      spriteBack: "assets/sprites/charmander_back.png",
      moves: [2, 5, 6, 7]
    },
    // Agrega más Pokémon como quieras
    {
      id: 143,
      name: "Snorlax",
      types: ["Normal"],
      maxHP: 190,
      attack: 100,
      defense: 65,
      speed: 30,
      level: 15,
      spriteFront: "assets/sprites/snorlax_front.png",
      spriteBack: "assets/sprites/snorlax_back.png",
      moves: [8, 9, 10, 11]
    }
  ];
  
  // Estados alterados posibles
  const statusEffects = {
    burned: {
      name: "Quemado",
      effect: (pokemon) => {
        // Pierde HP al final del turno
        const damage = Math.floor(pokemon.maxHP * 0.1);
        pokemon.currentHP = Math.max(pokemon.currentHP - damage, 0);
        return `${pokemon.name} está quemado y pierde ${damage} HP.`;
      },
      color: "#ff4500"
    },
    paralyzed: {
      name: "Paralizado",
      effect: (pokemon) => {
        // Puede perder el turno
        const skip = Math.random() < 0.25;
        return skip ? `${pokemon.name} está paralizado y no puede moverse!` : null;
      },
      color: "#ffff00"
    },
    asleep: {
      name: "Dormido",
      effect: (pokemon) => {
        // Dura de 1 a 3 turnos dormido
        if (pokemon.sleepTurns === undefined) pokemon.sleepTurns = Math.floor(Math.random() * 3) + 1;
        pokemon.sleepTurns--;
        if (pokemon.sleepTurns <= 0) {
          delete pokemon.sleepTurns;
          pokemon.status = null;
          return `${pokemon.name} se despertó!`;
        }
        return `${pokemon.name} está dormido y no puede atacar.`;
      },
      color: "#bbb"
    },
    poisoned: {
      name: "Envenenado",
      effect: (pokemon) => {
        const damage = Math.floor(pokemon.maxHP * 0.08);
        pokemon.currentHP = Math.max(pokemon.currentHP - damage, 0);
        return `${pokemon.name} sufre daño por veneno (${damage} HP).`;
      },
      color: "#8a2be2"
    },
  };
  
  // Movimientos
  const movesList = [
    {
      id: 1,
      name: "Impactrueno",
      type: "Electric",
      power: 40,
      accuracy: 100,
      ppMax: 35,
      status: null
    },
    {
      id: 2,
      name: "Ataque Rápido",
      type: "Normal",
      power: 40,
      accuracy: 100,
      ppMax: 30,
      status: null
    },
    {
      id: 3,
      name: "Cola Férrea",
      type: "Steel",
      power: 50,
      accuracy: 95,
      ppMax: 25,
      status: null
    },
    {
      id: 4,
      name: "Paralizador",
      type: "Electric",
      power: 0,
      accuracy: 70,
      ppMax: 20,
      status: "paralyzed"
    },
    {
      id: 5,
      name: "Lanzallamas",
      type: "Fire",
      power: 60,
      accuracy: 95,
      ppMax: 15,
      status: "burned"
    },
    {
      id: 6,
      name: "Arañazo",
      type: "Normal",
      power: 40,
      accuracy: 100,
      ppMax: 35,
      status: null
    },
    {
      id: 7,
      name: "Mordisco",
      type: "Dark",
      power: 60,
      accuracy: 100,
      ppMax: 25,
      status: null
    },
    {
      id: 8,
      name: "Golpe Cuerpo",
      type: "Normal",
      power: 70,
      accuracy: 90,
      ppMax: 15,
      status: null
    },
    {
      id: 9,
      name: "Descanso",
      type: "Psychic",
      power: 0,
      accuracy: 100,
      ppMax: 10,
      status: "asleep"
    },
    {
      id: 10,
      name: "Bofetón Lodo",
      type: "Poison",
      power: 65,
      accuracy: 85,
      ppMax: 20,
      status: "poisoned"
    },
    {
      id: 11,
      name: "Ronquido",
      type: "Normal",
      power: 0,
      accuracy: 100,
      ppMax: 15,
      status: "asleep"
    }
  ];
  
  // Tipos y efectividades simplificadas
  const typeChart = {
    Electric: { Water: 2, Flying: 2, Ground: 0, Steel: 1, Electric: 0.5, Fire: 1 },
    Fire: { Grass: 2, Ice: 2, Bug: 2, Steel: 2, Fire: 0.5, Water: 0.5, Rock: 0.5 },
    Water: { Fire: 2, Rock: 2, Ground: 2, Water: 0.5, Grass: 0.5, Dragon: 0.5 },
    Normal: {},
    Dark: { Psychic: 2, Ghost: 0 },
    Steel: { Rock: 2, Ice: 2, Fairy: 2, Fire: 0.5, Water: 0.5, Electric: 0.5 },
    Poison: { Grass: 2, Fairy: 2, Poison: 0.5, Ground: 0.5 },
    Psychic: { Fighting: 2, Poison: 2, Psychic: 0.5 },
    Flying: { Grass: 2, Fighting: 2, Bug: 2, Electric: 0.5 },
  };
  
  // Bosses para modo historia
  const bosses = [
    {
      name: "Boss Entei",
      pokemon: {
        id: 244,
        name: "Entei",
        types: ["Fire"],
        maxHP: 220,
        attack: 110,
        defense: 90,
        speed: 100,
        level: 25,
        spriteFront: "assets/sprites/entei_front.png",
        spriteBack: "assets/sprites/entei_back.png",
        moves: [5, 7, 10, 9]
      },
      dialogue: [
        "¡Prepárate para sentir el fuego!",
        "¡No escaparás de Entei!",
        "¡Vamos a arder!"
      ]
    },
    // Más bosses se pueden agregar aquí
  ];
  
  