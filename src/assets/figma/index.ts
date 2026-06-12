// Centralized Figma asset registry. Single source of truth so assets are reused across pages.
import hero from "./hero.png";
import product1 from "./product-1.png";

import catEarrings from "./cat-earrings.png";
import catRings from "./cat-rings.png";
import catBracelets from "./cat-bracelets.png";
import catChains from "./cat-chains.png";
import catPendants from "./cat-pendants.png";

import offerGold from "./offer-gold.png";
import offerDiamond from "./offer-diamond.png";
import sardarKeel from "./sardar-keel.png";
import bridal from "./bridal.png";
import temple from "./temple.png";

import matchEarrings from "./match-earrings.png";
import matchRings from "./match-rings.png";
import matchPendants from "./match-pendants.png";
import matchMangalsutra from "./match-mangalsutra.png";

import pGoldDiamondEarrings from "./p-gold-diamond-earrings.png";
import pElegantGoldRing from "./p-elegant-gold-ring.png";
import pPearlNecklaceSet from "./p-pearl-necklace-set.png";
import pDiamondBracelet from "./p-diamond-bracelet.png";
import pTraditionalGoldNecklace from "./p-traditional-gold-necklace.png";
import pDiamondStudEarrings from "./p-diamond-stud-earrings.png";
import pGoldChainBracelet from "./p-gold-chain-bracelet.png";
import pPearlDropEarrings from "./p-pearl-drop-earrings.png";
import pGoldChokerNecklace from "./p-gold-choker-necklace.png";
import pDiamondHoopEarrings from "./p-diamond-hoop-earrings.png";
import pRubyGoldRing from "./p-ruby-gold-ring.png";
import pPearlBracelet from "./p-pearl-bracelet.png";
import pFestiveBangles from "./p-festive-bangles.png";
import pWeddingNecklace from "./p-wedding-necklace.png";
import pDesignerEarrings from "./p-designer-earrings.png";
import pEmeraldRing from "./p-emerald-ring.png";

import cartGoldDiamondRing from "./cart-gold-diamond-ring.png";
import cartPearlNecklace from "./cart-pearl-necklace.png";

import logoSwarnaz from "./logo-swarnaz.png";

export const A = {
  hero,
  product1,
  logo: logoSwarnaz,
  cat: {
    earrings: catEarrings,
    rings: catRings,
    bracelets: catBracelets,
    chains: catChains,
    pendants: catPendants,
  },
  banner: {
    offerGold,
    offerDiamond,
    sardarKeel,
    bridal,
    temple,
  },
  match: {
    earrings: matchEarrings,
    rings: matchRings,
    pendants: matchPendants,
    mangalsutra: matchMangalsutra,
  },
  product: {
    goldDiamondEarrings: pGoldDiamondEarrings,
    elegantGoldRing: pElegantGoldRing,
    pearlNecklaceSet: pPearlNecklaceSet,
    diamondBracelet: pDiamondBracelet,
    traditionalGoldNecklace: pTraditionalGoldNecklace,
    diamondStudEarrings: pDiamondStudEarrings,
    goldChainBracelet: pGoldChainBracelet,
    pearlDropEarrings: pPearlDropEarrings,
    goldChokerNecklace: pGoldChokerNecklace,
    diamondHoopEarrings: pDiamondHoopEarrings,
    rubyGoldRing: pRubyGoldRing,
    pearlBracelet: pPearlBracelet,
    festiveBangles: pFestiveBangles,
    weddingNecklace: pWeddingNecklace,
    designerEarrings: pDesignerEarrings,
    emeraldRing: pEmeraldRing,
  },
  cart: {
    goldDiamondRing: cartGoldDiamondRing,
    pearlNecklace: cartPearlNecklace,
    product1, // reuse PDP-large for the third cart item
  },
};

export default A;
