/**
 * **Life tree — the Newick generator.**
 *
 * Emits a **fictional** phylogeny in Newick format: a root splitting into the
 * three domains of life, each recursively bifurcating down to invented species
 * binomials, with branch lengths and bootstrap support values.
 *
 * ### Why generated
 *
 * The previous source was the 145-species tree from Ciccarelli et al. (2006),
 * taken via d3's Tree of Life example. That paper is © AAAS and **no data
 * licence exists anywhere in the chain** — which fails the dataset licence
 * policy (see `docs/casestudies-rfc.md` §3).
 *
 * Nothing is lost. This dataset exists to be a **deep, unbalanced, three-way
 * partitioned hierarchy** for the radial / cluster / tidy-tree layouts — that
 * shape is what the stories read, and it reproduces exactly. The three domain
 * names (Bacteria, Archaea, Eukaryota) are universal taxonomic ranks, not
 * anyone's authorship; every genus and species below them is invented here.
 *
 * > If real phylogeny is ever wanted, the clean source is the
 * > **Open Tree of Life**, whose data is published under **CC0**.
 *
 * Same `seed` → byte-identical tree. The PRNG is mulberry32, the same one
 * `twitter/generators.ts` uses.
 */

/** The three domains of life — real taxonomic ranks, used as the top-level clades. */
const DOMAINS = ['Bacteria', 'Archaea', 'Eukaryota'] as const;

/**
 * Invented genus stems. Latin-ish so the tree reads like a phylogeny at a
 * glance, but none is a real published genus.
 */
const GENERA = [
  'Vexillomonas', 'Thermocladus', 'Halobacterium', 'Pyrostreptus', 'Cryobacter',
  'Nitrosophaera', 'Xanthocladia', 'Rhodospirula', 'Methanovibrio', 'Acidoferrax',
  'Luminexus', 'Sulfurimonas', 'Ferroplasma', 'Cyanolinea', 'Desulfovibra',
  'Thalassomyces', 'Chlorobacula', 'Prochloron', 'Micronema', 'Archaeoglobula',
  'Barophilus', 'Streptomycella', 'Anabaenopsis', 'Corynebacta', 'Zymomonella',
  'Plasmodiella', 'Trypanoforma', 'Saccharomycella', 'Dictyostelia', 'Paramecina',
  'Tetrahymenia', 'Chlamydomonella', 'Volvocaria', 'Euglenopsis', 'Amoebina',
];

/** Invented species epithets, combined with a genus to form a binomial. */
const EPITHETS = [
  'borealis', 'profunda', 'thermophila', 'halotolerans', 'minuta', 'gigantea',
  'lucida', 'obscura', 'ferrooxidans', 'psychrophila', 'acidophila', 'alkaliphila',
  'marina', 'terrestris', 'symbiotica', 'libera', 'aggregans', 'solitaria',
  'flexuosa', 'rigida', 'pallida', 'rubra', 'viridis', 'caerulea', 'nigra',
];

/** Deterministic PRNG (mulberry32) — same seed, same tree. */
function mulberry32(seed: number): () => number {
  let s = seed;
  return () => {
    s |= 0;
    s = (s + 0x6d2b79f5) | 0;
    let t = Math.imul(s ^ (s >>> 15), 1 | s);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Knobs for {@link generateLifeTreeNewick}. */
export interface LifeTreeOptions {
  /**
   * Leaf species per domain, in `[Bacteria, Archaea, Eukaryota]` order.
   * Default `[85, 20, 40]` — 145 species, deliberately lopsided so the three
   * sub-trees differ in depth and density the way a real phylogeny does.
   */
  speciesPerDomain?: readonly [number, number, number];
  /** PRNG seed — same seed → same tree. Default `2006`. */
  seed?: number;
}

/**
 * Generate the tree as a Newick string.
 *
 * Each domain's species are placed by recursive bisection: a clade splits its
 * species between two children until one is left, which yields the deep,
 * unbalanced topology the hierarchy layouts are interesting on. Branch lengths
 * shorten with depth (nearer relatives, shorter branches) and internal nodes
 * carry a bootstrap value in brackets, matching the format `parseNewick`
 * already tolerates.
 *
 * @example
 * const newick = generateLifeTreeNewick({ speciesPerDomain: [400, 90, 200] });
 */
export function generateLifeTreeNewick(options: LifeTreeOptions = {}): string {
  const counts = options.speciesPerDomain ?? ([85, 20, 40] as const);
  const rng = mulberry32(options.seed ?? 2006);

  const usedNames = new Set<string>();

  /** Compose a binomial that hasn't been used yet. */
  const binomial = (): string => {
    for (;;) {
      const g = GENERA[Math.floor(rng() * GENERA.length)]!;
      const e = EPITHETS[Math.floor(rng() * EPITHETS.length)]!;
      const name = `${g}_${e}`;
      if (!usedNames.has(name)) {
        usedNames.add(name);
        return name;
      }
      // Pools give 875 combinations; past that, disambiguate with a strain id
      // the way real sequence databases do.
      const strain = `${name}_str${Math.floor(rng() * 900) + 100}`;
      if (!usedNames.has(strain)) {
        usedNames.add(strain);
        return strain;
      }
    }
  };

  /** Branch length for a node at `depth` — shorter the deeper you go. */
  const branch = (depth: number): string =>
    (Math.max(0.00008, (0.09 / (depth + 1)) * (0.35 + rng())) ).toFixed(5);

  /**
   * Emit a clade holding `n` species as a Newick subtree.
   *
   * Splits are drawn between 30 % and 70 % rather than in half, which is what
   * produces the lopsided ladders a balanced split would never generate.
   */
  const clade = (domain: string, n: number, depth: number): string => {
    if (n <= 1) return `${binomial()}:${branch(depth)}`;

    const left = Math.max(1, Math.min(n - 1, Math.round(n * (0.3 + rng() * 0.4))));
    const a = clade(domain, left, depth + 1);
    const b = clade(domain, n - left, depth + 1);
    const support = 50 + Math.floor(rng() * 50);
    return `(${a},${b})${domain}_subclade:${branch(depth)}[${support}]`;
  };

  // The three domains hang off the root. Named exactly `Bacteria` / `Archaea` /
  // `Eukaryota` because `lifeTreeAsGraph` reads those names to stamp each
  // subtree's `kingdom`.
  const domains = DOMAINS.map((d, i) => {
    const n = counts[i] ?? 1;
    const inner = clade(d, n, 1);
    return `(${inner})${d}:${branch(0)}`;
  });

  return `(${domains.join(',')})LifeRoot:0.0;`;
}
