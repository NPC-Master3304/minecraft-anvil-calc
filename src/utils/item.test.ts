/* eslint-disable @typescript-eslint/no-non-null-assertion */
import {
  getItemData,
  areEnchantmentsPreserved,
  checkEnchantmentIsCompatible,
  mergeEnchantments,
  anvil,
  combineItems,
  instanceOfAnvilError,
  instanceOfCombineItemsError,
  MAX_ANVIL_COST,
  loadPresetForEdition,
} from "./item";
import sword_sharpness_preset from "../data/sword_sharpness_preset.json";
import spear_preset from "../data/spear_preset.json";
import enchantments from "../data/enchantments.json";
import { Enchantment, EnchantmentSpecification, ItemData, Settings } from "../models";

const createEnchantmentByName = (enchantment_name: string): Enchantment => {
  const enchantment_specification = enchantments.find(
    (enchantment) => enchantment.name === enchantment_name
  )
  if (!enchantment_specification) {
    throw new Error('Could not find enchantment specification by name');
  }
  return {
    name: enchantment_specification.name,
    level: enchantment_specification.max_level,
    specification: enchantment_specification,
  }
}

const getEnchantmentSpecificationByName = (enchantment_name: string): EnchantmentSpecification => {
  const enchantment_specification = enchantments.find(
    (enchantment) => enchantment.name === enchantment_name
  )
  if (!enchantment_specification) {
    throw new Error('Could not find enchantment specification by name');
  }
  return enchantment_specification;
}

it("get item data", () => {
  const item: ItemData = {
    name: "boots",
    enchantments: [
      {
        name: "protection",
        level: 4,
      },
    ],
    index: 0,
    penalty: 0
  };
  expect(getItemData(item).enchantments[0].specification?.max_level).toEqual(4);
});

it("test enchantment preservation", () => {
  const filtered_enchantments = [
    createEnchantmentByName("feather_falling"),
    createEnchantmentByName("protection"),
  ];

  const enchant_to_preserve = createEnchantmentByName("thorns");

  const sacrificedItemEnchantments = [
    enchant_to_preserve,
    ...filtered_enchantments,
  ];

  expect(
    areEnchantmentsPreserved(sacrificedItemEnchantments, filtered_enchantments)
  ).toEqual(true);

  enchant_to_preserve.preserve = true;

  expect(
    areEnchantmentsPreserved(sacrificedItemEnchantments, filtered_enchantments)
  ).toEqual(false);
});

it("test item-enchantment compatibility", () => {
  const settings: Settings = { java_edition: false, allow_multiple_armor_enhancements: false };
  let test_sword = {
    name: "sword",
    enchantments: [
      createEnchantmentByName("sharpness"),
    ],
    index: 0,
    penalty: 0
  };
  test_sword = getItemData(test_sword);
  expect(
    checkEnchantmentIsCompatible(
      test_sword,
      getEnchantmentSpecificationByName("smite"),
      settings
    )
  ).toEqual(false);
  expect(
    checkEnchantmentIsCompatible(
      test_sword,
      getEnchantmentSpecificationByName("unbreaking"),
      settings
    )
  ).toEqual(true);
});

it("test trident compatibility", () => {
  const settings: Settings = { java_edition: false, allow_multiple_armor_enhancements: false };
  let test_trident = {
    name: "trident",
    enchantments: [
      createEnchantmentByName("channeling"),
    ],
    index: 0,
    penalty: 0
  };
  test_trident = getItemData(test_trident);
  expect(
    checkEnchantmentIsCompatible(
      test_trident,
      getEnchantmentSpecificationByName("riptide"),
      settings
    )
  ).toEqual(false);
  expect(
    checkEnchantmentIsCompatible(
      test_trident,
      getEnchantmentSpecificationByName("loyalty"),
      settings
    )
  ).toEqual(true);
});

it("test merging enchanntments", () => {
  const settings: Settings = { java_edition: false, allow_multiple_armor_enhancements: false };
  const test_sword = {
    name: "sword",
    enchantments: [
      {
        ...createEnchantmentByName("sharpness"),
        level: 4,
      },
      {
        ...createEnchantmentByName("unbreaking"),
        level: 3,
      },
      {
        ...createEnchantmentByName("looting"),
        level: 1,
      },
    ],
    index: 0,
    penalty: 0
  };

  const test_book = {
    name: "book",
    enchantments: [
      {
        ...createEnchantmentByName("sharpness"),
        level: 4,
      },
      {
        ...createEnchantmentByName("unbreaking"),
        level: 3,
      },
      {
        ...createEnchantmentByName("looting"),
        level: 2,
      },
    ],
    index: 0,
    penalty: 0
  };

  const merge_results = mergeEnchantments(
    test_book,
    test_sword.enchantments,
    [...test_book.enchantments],
    settings
  );

  expect(
    merge_results.resultingEnchantments.find(
      (enchantment) => enchantment.name === "sharpness"
    )?.level
  ).toEqual(5);
  expect(
    merge_results.resultingEnchantments.find(
      (enchantment) => enchantment.name === "unbreaking"
    )?.level
  ).toEqual(3);
  expect(
    merge_results.resultingEnchantments.find(
      (enchantment) => enchantment.name === "looting"
    )?.level
  ).toEqual(2);
  expect(merge_results.cost).toEqual(3);
});

it("test anvil", () => {
  const settings: Settings = { java_edition: false, allow_multiple_armor_enhancements: false };
  const test_sword = {
    name: "sword",
    enchantments: [
      {
        ...createEnchantmentByName("sharpness"),
        level: 4,
      },
      {
        ...createEnchantmentByName("unbreaking"),
        level: 3,
      },
      {
        ...createEnchantmentByName("looting"),
        level: 1,
      },
    ],
    index: 0,
    penalty: 2,
  };

  const test_book = {
    name: "book",
    enchantments: [
      {
        ...createEnchantmentByName("sharpness"),
        level: 4,
      },
      {
        ...createEnchantmentByName("unbreaking"),
        level: 3,
      },
      {
        ...createEnchantmentByName("looting"),
        level: 2,
      },
      {
        ...createEnchantmentByName("loyalty"),
        level: 3,
      },
    ],
    index: 0,
    penalty: 1,
  };

  const anvil_results = anvil(test_sword, test_book, settings);
  expect(instanceOfAnvilError(anvil_results)).toBeFalsy;
  if (!instanceOfAnvilError(anvil_results)) {
    const anvil_enchantments = anvil_results.resultingItem.enchantments;
    expect(
      anvil_enchantments.find(
        (enchantment) => enchantment.name === "sharpness"
      )?.level
    ).toEqual(5);
    expect(
      anvil_enchantments.find(
        (enchantment) => enchantment.name === "unbreaking"
      )?.level
    ).toEqual(3);
    expect(
      anvil_enchantments.find(
        (enchantment) => enchantment.name === "looting"
      )?.level
    ).toEqual(2);
    expect(
      anvil_enchantments.find(
        (enchantment) => enchantment.name === "loyalty"
      )?.level
    ).toEqual(undefined);
    expect(anvil_results.cost).toEqual(7);
  }
});

it("test combine items", () => {
  const settings: Settings = { java_edition: false, allow_multiple_armor_enhancements: false };
  const test_sword = {
    name: "sword",
    enchantments: [
      {
        ...createEnchantmentByName("unbreaking"),
        level: 3,
      },
      {
        ...createEnchantmentByName("looting"),
        level: 1,
      },
    ],
    index: 0,
    penalty: 2,
  };

  const test_book_1 = {
    name: "book",
    enchantments: [
      {
        ...createEnchantmentByName("sharpness"),
        level: 5,
        preserve: true,
      },
      {
        ...createEnchantmentByName("unbreaking"),
        level: 3,
      },
      {
        ...createEnchantmentByName("looting"),
        level: 2,
      },
    ],
    index: 0,
    penalty: 1,
  };

  const test_book_2 = {
    name: "book",
    enchantments: [
      {
        ...createEnchantmentByName("smite"),
        level: 4,
      },
      {
        ...createEnchantmentByName("looting"),
        level: 2,
      },
    ],
    index: 0,
    penalty: 0,
  };

  let combine_results = combineItems(
    [test_sword, test_book_1, test_book_2],
    settings
  );
  expect(instanceOfCombineItemsError(combine_results)).toBeFalsy;
  if (!instanceOfCombineItemsError(combine_results)) {
    const combine_enchantments = combine_results.resultingItem.enchantments;

    // Sharpness
    expect(
      combine_enchantments.find(
        (enchantment) => enchantment.name === "sharpness"
      )?.level
    ).toEqual(5);
    expect(
      combine_enchantments.find(
        (enchantment) => enchantment.name === "unbreaking"
      )?.level
    ).toEqual(3);
    expect(
      combine_enchantments.find(
        (enchantment) => enchantment.name === "looting"
      )?.level
    ).toEqual(3);
    expect(
      combine_enchantments.find(
        (enchantment) => enchantment.name === "loyalty"
      )?.level
    ).toEqual(undefined);
    expect(
      combine_enchantments.find(
        (enchantment) => enchantment.name === "smite"
      )?.level
    ).toEqual(undefined);
    expect(combine_results.cost).toEqual(20);

    // Smite
    const sharpness_result = test_book_1.enchantments.find(
      (enchantment) => enchantment.name === "sharpness"
    )
    if (sharpness_result) {
      sharpness_result.preserve = false;
    }
    const smite_result = test_book_2.enchantments.find(
      (enchantment) => enchantment.name === "smite"
    )
    if (smite_result) {
      smite_result.preserve = true;
    }
  }

  combine_results = combineItems(
    [test_sword, test_book_1, test_book_2],
    settings
  );
  expect(instanceOfCombineItemsError(combine_results)).toBeFalsy;
  if (!instanceOfCombineItemsError(combine_results)) {
    const combine_enchantments = combine_results.resultingItem.enchantments;

    expect(
      combine_enchantments.find(
        (enchantment) => enchantment.name === "smite"
      )?.level
    ).toEqual(4);
    expect(
      combine_enchantments.find(
        (enchantment) => enchantment.name === "sharpness"
      )?.level
    ).toEqual(undefined);
    expect(combine_results.cost).toEqual(19);
  }

  // Java Edition
  settings.java_edition = true;
  combine_results = combineItems(
    [test_sword, test_book_1, test_book_2],
    settings
  );
  expect(instanceOfCombineItemsError(combine_results)).toBeFalsy;
  if (!instanceOfCombineItemsError(combine_results)) {
    expect(combine_results.cost).toEqual(29);
  }
});

it("test java overrides", () => {
  const settings: Settings = { java_edition: true, allow_multiple_armor_enhancements: false };
  const test_trident = {
    name: "trident",
    enchantments: [
    ],
    index: 0,
    penalty: 0,
  };

  const test_book_1 = {
    name: "book",
    enchantments: [
      {
        ...createEnchantmentByName("impaling"),
        level: 5
      },
    ],
    index: 0,
    penalty: 0,
  };

  const combine_results = combineItems(
    [test_trident, test_book_1],
    settings
  );
  expect(instanceOfCombineItemsError(combine_results)).toBeFalsy;
  if (!instanceOfCombineItemsError(combine_results)) {
    expect(combine_results.cost).toEqual(10);
  }
});

it("test allow multiple armor enhancements", () => {
  const settings: Settings = { java_edition: false, allow_multiple_armor_enhancements: true };
    const test_boots: ItemData = {
    name: "boots",
    enchantments: [
      {
        name: "protection",
        level: 4,
      },
    ],
    index: 0,
    penalty: 0
  };

  const test_book_1 = {
    name: "book",
    enchantments: [
      {
        ...createEnchantmentByName("fire_protection"),
        level: 4
      },
    ],
    index: 0,
    penalty: 0,
  };

  const combine_results = combineItems(
    [test_boots, test_book_1],
    settings
  );
  expect(instanceOfCombineItemsError(combine_results)).toBeFalsy;
  if (!instanceOfCombineItemsError(combine_results)) {
    expect(combine_results.resultingItem.enchantments).toHaveLength(2);
  }
});
it("test spear and lunge (26.3)", () => {
  const settings: Settings = { java_edition: true, allow_multiple_armor_enhancements: false };
  const test_spear: ItemData = {
    name: "spear",
    enchantments: [],
    index: 0,
    penalty: 0,
  };
  const test_book = {
    name: "book",
    enchantments: [createEnchantmentByName("lunge")],
    index: 1,
    penalty: 0,
  };
  // Lunge III from a book: max(1, anvil_cost 2 / 2) * 3
  const anvil_results = anvil(test_spear, getItemData(test_book), settings);
  expect(instanceOfAnvilError(anvil_results)).toBeFalsy();
  if (!instanceOfAnvilError(anvil_results)) {
    expect(anvil_results.cost).toEqual(3);
    expect(anvil_results.resultingItem.enchantments).toHaveLength(1);
  }
  // Sharpness applies to spears as of 26.3 (#minecraft:enchantable/melee_weapon)
  expect(
    checkEnchantmentIsCompatible(
      test_spear,
      getEnchantmentSpecificationByName("sharpness"),
      settings
    )
  ).toEqual(true);
  // Lunge does not apply to anything else
  expect(
    checkEnchantmentIsCompatible(
      { name: "sword", enchantments: [], index: 0, penalty: 0 },
      getEnchantmentSpecificationByName("lunge"),
      settings
    )
  ).toEqual(false);
});

it("test loyalty java anvil cost (26.3)", () => {
  const test_trident: ItemData = {
    name: "trident",
    enchantments: [],
    index: 0,
    penalty: 0,
  };
  const sacrifice_trident = getItemData({
    name: "trident",
    enchantments: [createEnchantmentByName("loyalty")],
    index: 1,
    penalty: 0,
  });
  // 26.3 loyalty.json raised anvil_cost to 2; Bedrock keeps 1
  const java_results = anvil(test_trident, sacrifice_trident, {
    java_edition: true,
    allow_multiple_armor_enhancements: false,
  });
  expect(instanceOfAnvilError(java_results)).toBeFalsy();
  if (!instanceOfAnvilError(java_results)) {
    expect(java_results.cost).toEqual(6);
  }
  const bedrock_results = anvil(test_trident, sacrifice_trident, {
    java_edition: false,
    allow_multiple_armor_enhancements: false,
  });
  expect(instanceOfAnvilError(bedrock_results)).toBeFalsy();
  if (!instanceOfAnvilError(bedrock_results)) {
    expect(bedrock_results.cost).toEqual(3);
  }
});

it("test incompatible enchantment surcharge", () => {
  const settings: Settings = { java_edition: true, allow_multiple_armor_enhancements: false };
  const test_sword = getItemData({
    name: "sword",
    enchantments: [createEnchantmentByName("sharpness")],
    index: 0,
    penalty: 0,
  });
  // AnvilMenu charges 1 level for the Sharpness/Smite conflict, then 1 x 3 for
  // Unbreaking III out of a book
  const mixed_book = getItemData({
    name: "book",
    enchantments: [
      createEnchantmentByName("smite"),
      createEnchantmentByName("unbreaking"),
    ],
    index: 1,
    penalty: 0,
  });
  const mixed_results = anvil(test_sword, mixed_book, settings);
  expect(instanceOfAnvilError(mixed_results)).toBeFalsy();
  if (!instanceOfAnvilError(mixed_results)) {
    expect(mixed_results.cost).toEqual(4);
  }
  // Nothing can transfer, so the anvil refuses the combination outright
  const smite_book = getItemData({
    name: "book",
    enchantments: [createEnchantmentByName("smite")],
    index: 2,
    penalty: 0,
  });
  const refused = anvil(test_sword, smite_book, settings);
  expect(instanceOfAnvilError(refused)).toBeTruthy();
  // An enchantment that simply does not apply to the target is free
  const loyalty_book = getItemData({
    name: "book",
    enchantments: [
      createEnchantmentByName("loyalty"),
      createEnchantmentByName("unbreaking"),
    ],
    index: 3,
    penalty: 0,
  });
  const free_results = anvil(test_sword, loyalty_book, settings);
  expect(instanceOfAnvilError(free_results)).toBeFalsy();
  if (!instanceOfAnvilError(free_results)) {
    expect(free_results.cost).toEqual(3);
  }
});

it("test too expensive limit", () => {
  const settings: Settings = { java_edition: true, allow_multiple_armor_enhancements: false };
  const test_sword: ItemData = {
    name: "sword",
    enchantments: [],
    index: 0,
    penalty: 5,
  };
  const test_book = getItemData({
    name: "book",
    enchantments: [createEnchantmentByName("mending")],
    index: 1,
    penalty: 3,
  });
  // (2^5 - 1) + (2^3 - 1) + 2 = 40
  const anvil_results = anvil(test_sword, test_book, settings);
  expect(instanceOfAnvilError(anvil_results)).toBeFalsy();
  if (!instanceOfAnvilError(anvil_results)) {
    expect(anvil_results.cost).toEqual(MAX_ANVIL_COST);
    expect(anvil_results.steps[0].tooExpensive).toEqual(true);
  }
});

it("test sword preset sweeping edge by edition", () => {
  const enchantmentNames = (items: ItemData[]) =>
    items.flatMap((item) => item.enchantments.map((enchantment) => enchantment.name));

  // Java Edition keeps the Sweeping Edge III book
  const java = loadPresetForEdition(sword_sharpness_preset, true);
  expect(java).toHaveLength(sword_sharpness_preset.length);
  expect(enchantmentNames(java)).toContain("sweeping_edge");

  // Bedrock Edition has no Sweeping Edge, so the book it came on is dropped
  // rather than left in the list empty, and the rest are re-indexed
  const bedrock = loadPresetForEdition(sword_sharpness_preset, false);
  expect(bedrock).toHaveLength(sword_sharpness_preset.length - 1);
  expect(enchantmentNames(bedrock)).not.toContain("sweeping_edge");
  expect(bedrock.every((item) => item.name !== "book" || item.enchantments.length > 0)).toBeTruthy();
  expect(bedrock.map((item) => item.index)).toEqual(bedrock.map((_, index) => index));
});

it("test java-only items dropped in bedrock", () => {
  // The spear is Java-only; its books survive but Lunge (Java-only) does not
  const bedrock = loadPresetForEdition(spear_preset, false);
  expect(bedrock.some((item) => item.name === "spear")).toBeFalsy();
  expect(
    bedrock.some((item) => item.enchantments.some((enchantment) => enchantment.name === "lunge"))
  ).toBeFalsy();

  const java = loadPresetForEdition(spear_preset, true);
  expect(java[0].name).toEqual("spear");
  expect(java).toHaveLength(spear_preset.length);
});

it("test sweeping edge anvil cost", () => {
  const settings: Settings = { java_edition: true, allow_multiple_armor_enhancements: false };
  const test_sword: ItemData = { name: "sword", enchantments: [], index: 0, penalty: 0 };
  const test_book = getItemData({
    name: "book",
    enchantments: [createEnchantmentByName("sweeping_edge")],
    index: 1,
    penalty: 0,
  });
  // sweeping_edge.json anvil_cost 4, halved for a book: 2 x III
  const anvil_results = anvil(test_sword, test_book, settings);
  expect(instanceOfAnvilError(anvil_results)).toBeFalsy();
  if (!instanceOfAnvilError(anvil_results)) {
    expect(anvil_results.cost).toEqual(6);
  }
});
