# R2 - Informal-economy evidence (FNB App of the Year Hackathon 2026)

Compiled 2026-10-05. Method: WebFetch and curl on the page itself, so quotes are literal spans from the fetched text. Arithmetic done in Python and marked "derived".

Evidence tags: **[P]** official or Parliament record. **[R]** press or research org, page fetched. **[V]** vendor, sponsored or advocacy claim. **[S]** search-result summary only, page not fetched or unreadable, treat as unverified. **NOT FOUND** means searched and absent. **NOT RESEARCHED** means no search was run.

Limit disclosed: the session's WebSearch budget (200 calls) ran out mid-task. Section F cashless fares and cash share were never researched. The coordinator then asked for the file to be written now, so no further searches were run.

---

## A. Spaza shops

### A1. How many spaza shops, and how big is the market

| Finding | Quote | Source URL | Date | Caveat |
|---|---|---|---|---|
| 140,000+ spazas, R42bn/yr (Nielsen 2016) [R] | "There are over 140,000 of these micro-enterprises nationally, collectively trading over R42 billion worth of goods a year, according to 2016 figures from Neilson." | https://gga.org/?p=611 | 1 Oct 2017 (2016 data) | Old. Secondary relay of Nielsen. |
| 150,000+ spazas, R178bn (Accenture 2023) [R] | "more than 150,000 spaza shops are part of South Africa's 'hidden economy,' which has an estimated market size of R178 billion" | https://dailyinvestor.com/south-africa/55981/the-hidden-economy-that-employs-7-8-million-south-africans/ | 29 Jun 2024 | Press relay. Accenture report not located. |
| Informal FMCG R197bn (2023), ~150,000 stores [R] | "informal FMCG retail market in 2023 was estimated to be R197 billion, according to Trade Intelligence"; "around 150,000 stores in the sector" | https://businessreport.co.za/business/jobs/2024-09-11-sa-informal-retail-market-grows-by-6-percent-to-r197-billion | 11 Sep 2024 | Same article prints "at least 1.1 million people regularly shopping". Other sources say 11.1m, so likely a typo. |
| Informal FMCG R220bn in 2025, +5.9% [R] | "informal FMCG market grew by 5.9% to an estimated R220bn in 2025" | https://www.bizcommunity.com/article/sas-r220bn-informal-fmcg-market-keeps-growing-despite-pressure-964594a | 28 Aug 2026 | Trade Intelligence estimate. Scope is informal FMCG, not spaza only. |
| 190,000 "Traditional Trade" outlets, R170bn FMCG (NIQ) [V] | "around 190,000 Traditional Trade outlets: spazas, independent grocers, liquor stores, taverns"; "Around R170 billion in FMCG sales" | https://nielseniq.com/global/en/insights/analysis/2026/why-street-level-retail-visibility-matters-more-than-ever-in-south-africa/ | 12 May 2026 | Marketing page. Outlet count includes taverns and liquor stores. R170bn, R178bn, R197bn and R220bn use different scopes. Do not add or compare them. |
| ~95% of informal traders source stock from independent wholesalers [R] | "around 95% of them source their stock through independent wholesalers" | https://www.ewn.co.za/2025/09/30/independent-operators-as-alternative-to-big-supermarket-chains-a-huge-force-in-sa-retail-economy | 30 Sep 2025 | Trade Intelligence via radio interview. |
| 2019 claim: spaza market R40bn/yr, 90%+ cash [V] | "valued at around R40 billion per year and that 90% or more of the transactions are in cash" | https://www.itnewsafrica.com/top-stories/spaza-shop-fintech-closes-a-gap-in-this-r40bn-cash-market/ | 12 Mar 2019 | Start-up founder claim. Conflicts with later R170-220bn scopes. Use for the cash direction only. |
| Stats SA-based 80,000-120,000 spaza owners [S] | (search summary only) | https://www.pressreader.com/south-africa/business-day/20230413/281728388804097 | Apr 2023 | Page returned 403. Unverified. |

Derived (Python): 82,924 applications (A3) is 55.3% of 150,000 stores and 43.9% of 189,000 outlets. The denominators are unreliable.

### A2. Late-2024 foodborne-illness crisis

| Finding | Quote | Source URL | Date | Caveat |
|---|---|---|---|---|
| Naledi, Soweto: six children died of terbufos [R] | "Minister of Health Aaron Motsoaledi said the children from Naledi, Soweto, died of Terbufos ingestion." | https://www.foodsafetynews.com/2024/10/chemical-linked-to-fatal-poisoning-in-south-africa-revealed | Oct 2024 | Terbufos is an organophosphate insecticide, same page. |
| 84 spaza shops visited by 80 environmental health practitioners [R] | "A group of 80 environmental health practitioners was joined by officials from other government departments in visiting 84 spaza shops" | same | Oct 2024 | The "3 of 84 positive" figure is [S] only. |
| National disaster declared [R] | "The National Disaster Management Centre has declared foodborne illnesses a national disaster following the deaths of at least 22 children, including six in Naledi, Soweto" | https://www.news24.com/southafrica/news/foodborne-illnesses-declared-a-national-disaster-20241121 | 21 Nov 2024 | "Suspected" contamination. The Agriculture Minister said terbufos "might have been imported illegally", same article. |
| Cumulative toll by Feb 2025 [P] | "over 890 cases and nearly 30 deaths since September 2024" | https://www.sanews.gov.za/index.php/node/73333 | 13 Feb 2025 | Government news agency. Counts are approximate: "over" and "nearly". |
| eNCA count at deadline [R] | "deaths of over 20 children after eating snacks from local spaza shops and vendors" | https://www.enca.com/top-stories/spaza-shops-registration-deadline-looms | 11 Dec 2024 | Lower than the 22 and "nearly 30" figures above. Different cut-off dates. |

### A3. Registration drive: applied, approved, rejected

| Finding | Quote | Source URL | Date | Caveat |
|---|---|---|---|---|
| 21-day window, first extension [R] | "392 registration centers were established in all nine provinces and 42,915 applications were received between November 15 and yesterday"; "19,386 have been approved" | https://www.iol.co.za/news/politics/registration-of-spaza-shops-across-south-africa-extended-to-february-2025-b28d5f1e-e559-4e98-9fb8-c8d8b22abef6 | 18 Dec 2024 | The same IOL sentence prints "49,915" for the denominator. Business Day says 42,915. Derived approval rate: 45.2% (or 38.8% if 49,915). |
| Deadline moved 17 Dec 2024 to 28 Feb 2025 [R] | "extend the registration deadline ... to February 28 2025" | same, and https://www.businessday.co.za/bd/national/2024-12-18-government-extends-the-registration-of-spaza-shops/ | 18 Dec 2024 | Business Day also lists provincial approvals, e.g. KZN "749" of "7,187" and Mpumalanga "7,263" of "9,283". |
| Gauteng, 20 Dec 2024 [P] | "21 172 registration forms have been issued"; "10 389 application forms have been submitted"; "a total of 541 spaza shops have been closed for non-compliance" | https://www.sanews.gov.za/index.php/node/72550 | 20 Dec 2024 | Forms issued and applications submitted are different things. Gauteng's 10,389 is a different count from Business Day's Gauteng "2,605" applications. Counting rules are not consistent. |
| Municipalities unready at the deadline [P] | "only 60 out of the municipalities in the country had a digital registration system" | https://www.sanews.gov.za/index.php/node/73633 | 2 Mar 2025 | The Minister said applicants awaiting outcomes "will not be penalised". |
| Latest national count (Parliament) [P] | "the number of spaza shops who had lodged their registration/applications between July 2024 and June 2025 stood at 82 924"; "15 528 applications have been approved by the respective municipalities" | https://pmg.org.za/committee-question/33359/ | 21 Oct 2025 | Derived: 18.7% approved, 67,396 not approved. The reply does not split pending from rejected. **Rejected count: NOT FOUND.** The approved figure (15,528) is lower than the 19,386 approved reported in Dec 2024, so definitions differ. |
| Registration is a municipal process, with no national database [P] | "The DSBD is currently supporting the implementation of the e registration system which will allow for a centralized national database." | same | 21 Oct 2025 | A national register did not exist as of Oct 2025. |
| 2026: metro applications since 1 Jan 2025 [P] | "As at 06 May 2026 ... City of Johannesburg ... 139; Tshwane ... 82; Ekurhuleni ... 122; Cape Town ... 48; eThekwini ... 392; Nelson Mandela Bay ... 23; Buffalo City ... 26; Mangaung ... 136" | https://pmg.org.za/committee-question/38284/ | 10 Jun 2026 | Sum is 968 (derived). The reply's wording blends in Support Fund text, so the scope is ambiguous. Read it as "new applications after the drive are a trickle", with caution. |
| 2026: compliance "still very low" in Joburg [R] | "About 200 spaza shops in the City of Johannesburg have submitted their applications to the R500-million Spaza Shop Fund"; "Of the 13,500 spaza shops identified and issued registration forms across the province, only 200 in Johannesburg have so far been accounted for in the fund" | https://www.enca.com/news/spaza-shop-compliance-applications-remain-low-says-joburg-mayor | 18 Mar 2026 | The mayor's statement mixes province and city. Requirements named: building plans, city permission, rezoning. |

### A4. Inspections, expired and counterfeit food

| Finding | Quote | Source URL | Date | Caveat |
|---|---|---|---|---|
| Inspections Oct 2024 to May 2025, by province [P] | "Eastern Cape 6 725 Gauteng 9 976 Free State 1 896 Mpumalanga 4 025 Kwazulu-Natal 5 563 Limpopo 7 630 North-West 5745 Northern Cape 7 193 Western Cape 11 850" | https://pmg.org.za/committee-question/31196/ | 7 Jul 2025 | Sum is 60,603 (derived). These are multidisciplinary inspections including spaza shops, not spaza-only. |
| Notices and seizures [P] | "5 051 compliance notices and 1 157 prohibition notices"; "5337kg of non-compliant food products were detained and seized"; "567" food samples sent to NHLS | same | 7 Jul 2025 | **Expired vs counterfeit split: NOT FOUND.** The reply says inspections assess "expiry dates, suspected counterfeit items". 5,337 kg over 60,603 inspections is a thin evidence trail. |
| Capacity limit [P] | "a significant shortage of environmental health personnel within municipalities continues to hinder the frequency of inspections" | same | 7 Jul 2025 | Gauteng: "437 environmental health practitioners" (SAnews 20 Dec 2024). |
| Gauteng non-compliance rate [R] | "7,802 inspections of spaza shops ... 1,444 shops having been found to be non-compliant" | https://iol.co.za/news/south-africa/2025-02-02-gautengs-economic-checks-reveal-significant-non-compliance-among-spaza-shops/ | 2 Feb 2025 | Derived: 18.5% non-compliant. Inspected shops were likely not a random sample. |

### A5. Spaza credit, record-keeping, payments

| Finding | Quote | Source URL | Date | Caveat |
|---|---|---|---|---|
| Few separate personal and business money [R] | "only 38 out of 100 spazas we interviewed separate theirr personal expenses from their business expenses" | https://bfaglobal.com/digital-spazas/insights/how-credit-can-unlock-growth-and-contribute-to-the-financial-health-of-spazas-in-south-africas-informal-economy/ | 2 Dec 2022 | Programme interviews, not a representative sample. The typo "theirr" is in the source. |
| Stock-on-terms is the main credit need [R] | "spazas have a need to access about R12,000 in stock each week, with an ideal repayment term of 7-15 days"; "One-third ... access some form of stock on terms already" | same | 2 Dec 2022 | The two-thirds without terms is the opportunity. |
| Precedent: Yebo Fresh "Stock Boost", under 1% default [R] | "about 300 spazas signing up during the 5-month pilot with default rates of less than one percent (1%)"; stock value "ZAR 5,578,689" by Nov 2022 | same | 2 Dec 2022 | Small pilot, operator-reported, field-agent relationship lending. |
| 1% accept e-payments, 56% unbanked [R] | "only 1% of informal retailers in South Africa accept electronic payments, and 56% do not have access to a bank account" | https://bfaglobal.com/our-work/digital-spazas-digitizing-and-connecting-informal-spaza-shops-in-south-africas-townships/ | undated (Digital Spazas programme, c. 2020-22) | Dated. Likely much higher card uptake now (see Pepkor row, A7). |
| Cash-only blocks records and credit history [V] | "cash-only trading ... creates problems with record-keeping, limits the ability to build creditworthiness" | https://businesstech.co.za/news/industry-news/839854/empowering-the-township-economy-how-debit-credit-card-payments-and-debicheck-solutions-fuel-spaza-shop-success/ | 14 Oct 2025 | **Sponsored content (Altron FinTech).** The shop stories in it are illustrative, not data. |

### A6. Government support fund (a possible data and onboarding channel)

| Finding | Quote | Source URL | Date | Caveat |
|---|---|---|---|---|
| Funnel as of Oct 2025 [P] | "10 993 applications have registered and started"; "2125 have been completed"; "109 have confirmed licenses and been verified" | https://pmg.org.za/committee-question/33360/ | 21 Oct 2025 | Derived: 109 is 1.0% of started and 5.1% of completed. Municipal licence confirmation was the bottleneck. R6.3m disbursed (R4.1m stock, R2.2m POS). |
| Funnel as of mid-2026 [P] | "As of 28 May 2026, SEDFA have received 4 673 spaza shop applications"; "approved 1 319 spaza shops to South African applicants as of 08 June 2026 valued at R 79.8 million" | https://pmg.org.za/committee-question/39304/ | 10 Jul 2026 | Derived: 28.2% approved, about R60.5k per shop. Province table sums to 1,319. Application counts are lower than the Oct 2025 "started" figure of 10,993, so they are different measures. |
| Eligibility excludes foreign owners [P] | "owner of the Spaza Shop must be a South African citizen or naturalised as a South African citizen prior to 1994"; "no foreign national applied" | https://pmg.org.za/committee-question/39304/ and https://pmg.org.za/committee-question/38284/ | Jul and Jun 2026 | Any product keyed to fund eligibility excludes foreign-owned spazas. Their share of all spazas: NOT FOUND. |
| Earlier programme [P] | "cumulatively supported 13,364 MSMEs to the value of R83,951,300.00" | https://pmg.org.za/committee-question/32485/ | 18 Aug 2025 | Spaza Shop Support Programme, 2020 to Mar 2025. |

### A7. Do FMCG brands and wholesalers want informal-channel data?

| Finding | Quote | Source URL | Date | Caveat |
|---|---|---|---|---|
| Brands can't see the channel [V] | "In Modern Trade, the data infrastructure exists ... Traditional Trade doesn't. At least not to the same level of granularity. And where data does exist, it's rarely impartial." | https://nielseniq.com/global/en/insights/analysis/2026/why-street-level-retail-visibility-matters-more-than-ever-in-south-africa/ | 12 May 2026 | NIQ sells the fix, so it has an incentive to overstate the gap. |
| NIQ is already building the outlet census [V] | "NIQ South Africa is building ... a street-by-street census of every Traditional Trade outlet in the country. 189,000 outlets. ... GPS-verified, photographed, assessed for brand presence and supply source." | same | 12 May 2026 | This is the incumbent method: field audit. A shelf-photo product must beat or feed it. |
| Concentrated shelves: fewer SKUs matter [V] | "In Traditional Trade, the same 80% comes from just 12 SKUs" (vs "around 41 SKUs" in Modern Trade) | same | 12 May 2026 | Derived ratio 3.4x. Supports a small SKU catalogue for recognition. |
| Informal-trader fintech consolidation [R] | Pepkor creates "a R21.3bn entity that will operate in the fast-growing township economy"; Shop2Shop "has some 177,000 informal traders on its books" | https://www.timeslive.co.za/news/2026-07-22-pepkor-creates-r21bn-fintech-business-eyes-jse-listing/ and https://iol.co.za/business-report/companies/2026-07-22-pepkors-flash-to-merge-with-shop2shop-to-create-a-leading-merchant-platform/ | 22 Jul 2026 | A well-funded incumbent already holds an informal merchant network. |

---

## B. Stokvels

| Finding | Quote | Source URL | Date | Caveat |
|---|---|---|---|---|
| NASASA: 810,000 groups, 11m+ members, R50bn/yr [R] | "roughly 810,000 active stokvel groups consisting of more than 11 million South Africans and collecting an estimated R50bn annually" | https://www.fanews.co.za/article/banking/35/general/1223/fnb-launches-a-new-no-monthly-account-fees-digital-account-for-stokvels/31210 | 17 Feb 2021 | Attributed to NASASA inside FNB's launch article. Derived: R4,545 per member per year. |
| NASASA chair, 2023 [R] | "estimated to exceed 11,5 million and the saving is valued at over R49 billion per annum" | https://sundayindependent.co.za/news/2023-10-10-sa-stokvels-saving-billions-buying-property-despite-rising-cost-of-living | 10 Oct 2023 | Self-reported estimate. |
| NASASA chair, 2025 [R] | "more than 11 million South Africans are believed to be members of stokvels" | https://www.ewn.co.za/more-than-11-million-south-africans-are-members-of-stokvels-nasasa | 14 Aug 2025 | The headline R45bn and 11m figure already appeared in a Fin24 URL slug dated 2015-11-05 (slug only, page not readable). The numbers have barely moved in a decade, so treat them as stale. |
| FNB already has a stokvel account [R] | "FNB has launched a new no monthly account fees digital account for Stokvels"; "earning interest from just one Rand" | same FAnews article | 17 Feb 2021 | Directly relevant: the sponsor owns this product. |
| FNB payout control [R] | "the Treasurer or administrator of the Stokvel initiates member pay-outs which must be approved by two extra signatories" | same FAnews article | 17 Feb 2021 | Current product page (fnb.co.za) was blocked by a bot wall. A search summary says 3 signatories and "up to 6.25% interest" [S]. |
| NASASA also sells products and is a self-regulating body [V] | Site menu: "Stokvel Savings Bond Stokvel Funeral Plan Stokvel Savings Plan Stokvel Grocery Plan" | https://www.nasasa.co.za | 5 Oct 2026 (crawl) | Navigation labels only. |
| Treasurer/signatory theft, one case [R] | "the pair, among the registered account signatories, made the withdrawals amounting to R600 000 without authority"; "invested it in cryptocurrency" | https://sundayworld.co.za/crime/two-arrested-for-plundering-r600k-from-stokvel-club-account | 30 Mar 2025 | A single case. It shows two-signatory controls fail under collusion. |
| Scam branded as a stokvel [R] | "in contact with about 600 investors, 236 of whom have lost a cumulative amount of between R12-million and R22.8-million" | https://www.dailymaverick.co.za/article/2023-07-29-unpacking-the-united-african-stokvel-scam-the-trail-of-death-threats-and-ties-to-nonprofit-sexpo/ | 29 Jul 2023 | An investment scam, not a conventional stokvel. NASASA membership application was rejected in 2019 [S]. |
| Aggregate stokvel fraud or treasurer-theft statistic | **NOT FOUND** | n/a | n/a | No SAPS, FSCA or NASASA total located. Only case reports. |

---

## C. Computer-vision datasets usable offline

| Dataset | Facts | Link | Size | Licence | Caveat |
|---|---|---|---|---|---|
| SKU-110K (dense shelf detection) | "an extensive, annotated data set, SKU-110K, representing packed retail environments" (arXiv abstract). Counts [S]: 11,762 images, about 1.7m boxes, 8,233/588/2,941 split. | https://arxiv.org/abs/1904.00853 ; official tarball http://trax-geometry.s3.amazonaws.com/cvpr_challenge/SKU110K_fixed.tar.gz | **12,196,152,718 bytes (12.2 GB)** by HTTP HEAD, 5 Oct 2026 | "provided for the exclusive use by the recipient and solely for academic and non-commercial purposes" (GitHub README https://github.com/eg4000/SKU110K_CVPR19) | Non-commercial. Images from US, Europe, East Asia per [S] summary, so there is a domain gap to spaza shelves. |
| SKU-110K HF mirror (annotation-unified) | finedet/sku110k | https://huggingface.co/datasets/finedet/sku110k | 12.28 GB (API sum of files) | cc-by-nc-2.0 | Mirror. Original licence terms still apply. |
| SKU-110K HF mirror (parquet) | PrashantDixit0/SKU-110K | https://huggingface.co/datasets/PrashantDixit0/SKU-110K | 62.61 GB | cc-by-nc-2.0 | Much larger than the original, avoid. |
| SKU-110K test split (FiftyOne) | Voxel51/sku110k_test, "2936 samples" | https://huggingface.co/datasets/Voxel51/sku110k_test | 11.01 GB | none listed | Test split only. |
| Expiry-date recognition (HF) | dimun/dates. Original: Seker and Ahn 2022, Expert Systems with Applications. | https://huggingface.co/datasets/dimun/dates | 394.2 MB | apache-2.0 (mirror metadata) | Licence of the original is unverified. Image count not stated on the card. Not SA packaging. |
| Food-packaging OCR (Mendeley) | Annotations for text detection and recognition "covering product name, brand, ingredient list, nutritional information and validity period" | https://data.mendeley.com/datasets/3cpx2fmn3r/2 (DOI 10.17632/3cpx2fmn3r.2) | not stated on page | CC BY 4.0 | Published 15 Jun 2026. Contributor affiliation: Multimedia University, Malacca. Not SA packaging. |
| Bottle-cap date stamps (HF) | aihpi/bottle-cap-date-stamps, size category n<1K | https://huggingface.co/datasets/aihpi/bottle-cap-date-stamps | 827.6 MB | cc-by-4.0 | Under 1,000 images. Reusable-bottle context, not retail packs. |
| Generic grocery detection (HF) | ComputerScienceHouse/GroceryInContext | https://huggingface.co/datasets/ComputerScienceHouse/GroceryInContext | 0.03 GB | MIT | Tiny. |
| Shelf-audit set (HF) | adnankhan-11/smart-retail-shelf-auditing-v1, 10k rows (7k/2k/1k) | https://huggingface.co/datasets/adnankhan-11/smart-retail-shelf-auditing-v1 | 9.74 GB | none listed | Provenance unknown. |
| Kaggle supermarket shelves [S] | "45 images with 11,743 bounding boxes" | https://www.kaggle.com/datasets/humansintheloop/supermarket-shelves-dataset/data | n/a | n/a | Kaggle page unreadable here. Search summary only. |
| African or SA retail product-image dataset | **NOT FOUND**. HF API search "spaza" returned nothing. "africa retail" returned only synthetic Nigerian tabular sets (electricsheepafrica/africa-synth-retail-...), not images. | n/a | n/a | n/a | Kaggle and Zindi were not checked directly. |
| Kiosk SKU long-tail evidence (Nairobi) | "an average residential kiosk sells from between six hundred (600) and eight hundred (800) product classes"; "approximately thirty percent (30%) did not include barcodes"; "more than ninety-five percent (95%) of sales by modeling two hundred (200) product classes" | https://patents.google.com/patent/US11804112B2/en | filed 2018-07-12, priority 2017-07-12 | n/a | A **Mastercard Asia Pacific** patent narrative, status "Active, expires 2039-08-20". Not peer reviewed. It is also a freedom-to-operate flag for kiosk product recognition (not legal advice). |

---

## D. Livestock

### D1. Stock theft and herd

| Finding | Quote | Source URL | Date | Caveat |
|---|---|---|---|---|
| Value stolen per year, cattle, sheep, goats [R] | "2020/21: R1 185 118 700 2021/22: R1 210 939 100 2022/23: R1 275 954 200 2023/24: R1 380 267 000 2024/25: R1 269 999 000" | https://www.farmersweekly.co.za/agri-news/south-africa/stock-theft-deals-major-economic-blow-to-sas-agri-sector | 12 Jun 2025 | "According to official statistics", with the body not named. Text says "over R7 billion over the past five years" but the five listed values sum to **R6.32bn** (derived). Reported crime only. The quoted expert says actual cost is unknown due to non-reporting. |
| Cases and animals, 2024/25 [V] | "36 109 cases of stock theft were reported – a 3.5% increase"; "152 033 animals were stolen" | https://www.da.org.za/2025/08/over-152-000-animals-stolen-da-backs-minister-steenhuisens-fight-against-stock-theft | 26 Aug 2025 | Party press release attributing to Stats SA GPSJS 2024/25. Farmer's Weekly says cases fell about 9% in Q4 2024/25 and have declined since 2018/19. The two series conflict. Derived: R8,353 per animal if you divide the two (different bases, indicative only). |
| Sekhukhune district [P] | "683 incidents of stock theft were reported ... The reported value was R 39 361 265.00" | https://pmg.org.za/committee-question/35286/ | 31 Dec 2025 | One district, 12 months. Police outreach stresses "marking of stock" and "late reporting of cases". |
| Unmarked animals can't be returned [R] | "Non-compliance with the Animal Identification Act, which mandates livestock marking"; unreturned animals: 2022/23 "2", 2023/24 "82", 2024/25 "328" | https://www.protectionweb.co.za/civil-security/parliamentary-inquiry-sheds-light-on-saps-strategy-and-challenges-in-combating-stock-theft/ | 15 Dec 2025 | Trade-press summary of a parliamentary briefing. |
| RMIS stock-theft figure | **NOT FOUND** | n/a | n/a | No RMIS number located. |
| Communal share of herd [R] | "Communal farmers reportedly account for up to 50% of South Africa's national herd, which currently numbers around 14 million cattle." | https://dailyinvestor.com/south-africa/131779/john-steenhuisens-crisis-laying-waste-to-small-towns-across-south-africa/ | 3 May 2026 | "Reportedly", no primary source. Older estimates were about 40% [S]. Treat as a range of 40-50%. Derived: up to 7m head. |
| FMD national disaster [R] | "declared a national disaster by President Cyril Ramaphosa in February 2026"; "No animal that hasn't been vaccinated is allowed to move through the system" | same | 3 May 2026 | Movement control and vaccination records now matter. The same article reports 27 communal auctions cancelled. |

### D2. Muzzle-print biometrics

| Finding | Quote | Source URL | Date | Caveat |
|---|---|---|---|---|
| Best published accuracy, US feedlot [R] | "The best identification accuracy was 98.7%"; "268 US feedlot cattle and 4923 muzzle images" | https://digitalcommons.unl.edu/animalscifacpub/1181 (Animals 2022, 12:1453) | 4 May 2022 | Closed-set classification of known animals. Angus-type feedlot cattle. Not open-set verification. |
| Same images, CMU-Africa [R] | "a maximum accuracy of 99.5% is achieved while using the wide ResNet50 model with a compression retaining 25% of the original image" | https://arxiv.org/abs/2311.08148 | 14 Nov 2023 | Uses the same 4,923 images and 268 cattle. Compression tested "to adapt the models to work for the African context". Not African cattle. |
| Detection plus classification [R] | "YOLOv3 ... 99.13% accuracy"; ResNet-50 "(99.1%)" | https://rune.une.edu.au/web/handle/1959.11/56706 | undated | University of New England thesis. States "a lack of publicly available datasets involving cattle muzzle biometrics". |
| Harder conditions: multi-angle and occlusion [R] | "31,312 images from 658 cattle, CattleMuzzleNet achieved an accuracy of 97.87%" | https://www.frontiersin.org/journals/veterinary-science/articles/10.3389/fvets.2025.1660163/full | 21 Jan 2026 | Positioned for insurance claim fraud. Breed and country not extracted. |
| Dataset: Zenodo beef muzzle | "BeefCattle_Muzzle_database.zip" | https://zenodo.org/record/6324361 | 3 Mar 2022 | 643.7 MB, CC-BY-4.0, 4,923 images, 268 cattle (derived 18.4 images per animal). |
| Dataset: CattleMuzzle (HF) | Data availability statement of the Frontiers paper | https://huggingface.co/datasets/MingShuo666/CattleMuzzle | 17 Dec 2025 (last modified) | 2.75 GB, no licence metadata on the API. |
| Dataset: Cattle Biometrics (Data in Brief) | "more than 8,000 annotated samples derived from several cow breeds" | https://www.ncbi.nlm.nih.gov/pmc/articles/PMC10869238/ | 2 Feb 2024 | CC BY. Authors based in Karachi. |
| Kaggle or Mendeley muzzle sets | **NOT FOUND** (Kaggle pages unreadable) | n/a | n/a | Not confirmed either way. |
| SA breeds (Nguni etc.) and field conditions | **NOT FOUND** | n/a | n/a | All accuracy numbers are on feedlot or lab-like images. Do not quote 99% as an SA field figure. |

### D3. Livestock as collateral

| Finding | Quote | Source URL | Date | Caveat |
|---|---|---|---|---|
| Kenya: livestock accepted on a national movables registry [R] | "The BRS notes a 53.6 percent increase in the use of livestock and securities such as shares and bonds as loan collateral"; "livestock used for loans rose to 23,686" | https://peopledaily.digital/insights/why-kenyans-are-moving-away-from-using-cars-and-households-to-get-loans/amp | 22 Sep 2025 | Financial year to 30 Jun 2025. Units are registered items, not animals. The same article notes banks are cautious "due to rising defaults". |
| Ethiopia: dairy cows as collateral [R] | Livestock-Based Lending Project lets smallholders "use their cows as collateral to access credit" | https://www.ilri.org/knowledge/publications/unlocking-finance-through-livestock-ethiopias-innovative-lending-model | Dec 2025 | Launched June 2025. Programme launch report, with no repayment or default data. |
| SA precedent: livestock banks (in kind) [R] | "Groups of five members are granted loans of 40 ewes by the bank. Each member of the group guarantees the loan" | https://farmafrica.org/wp-content/uploads/2024/07/WP5-Tracking-the-Performance-of-Livestock-Banks-Northern-Cape-South-Africa.pdf | May 2007 | NGO-run, in-kind, Northern Cape. Not bank collateral lending. |
| India: muzzle biometrics for livestock insurance claims [S] | (search summary: InsureCow, DigiBima, Cattlinsure) | n/a | n/a | Not fetched. |
| SA bank pilot taking livestock as collateral | **NOT FOUND** | n/a | n/a | An FNB-USAID R300m guarantee for black farmers surfaced only as a 2012 search snippet [S]. |

---

## E. Water

| Finding | Quote | Source URL | Date | Caveat |
|---|---|---|---|---|
| National non-revenue water (DWS No Drop 2023) [P] | "NRW of 2.1 billion m3/annum (47.4%) and water losses of 1.8 billion m3/annum (40.8%)" | https://www.dws.gov.za/Projects/wueew/documents/webinfo/ND_2023_Report.pdf | data to June 2023 | Based on "88 datasets (61%)" of water services authorities. The PDF's foreword is headed "Draft". Real losses 1.41bn of 4.39bn m3 input, derived 32.1%. |
| Latest briefing [P] | "non-revenue water remained persistently high at 47.3%" | https://pmg.org.za/committee-meeting/43264/ | 9 Jun 2026 | DWS briefing to Parliament on the 2025 Green, Blue and No Drop reports. |
| Joburg: outages and leak counts [R] | "at least 22 major water outages" since 31 Dec; "20,915 leaks and pipe bursts between 1 July and 15 December 2025" | https://www.dailymaverick.co.za/article/2026-01-22-joburgs-water-woes-continue-in-2026-with-22-major-outages-in-two-weeks/ | 22 Jan 2026 | Leak count is from the Gauteng Water Security Dashboard. Derived: 124.5 per day over 168 days. |
| Joburg: infrastructure gap [R] | "Joburg Water needs more than R27-billion"; budget "R1.7-billion"; "replace only 17km" of 12,364 km | same | 22 Jan 2026 | Derived: need is 15.9 times the budget. 0.14% of pipe replaced. |
| Joburg: chronic outage days [R] | "more than 50 days without water so far this year, according to the Melville Residents Association" | https://www.dailymaverick.co.za/article/2026-08-14-melville-residents-have-gone-without-water-for-over-20-of-2026-so-far/ | 14 Aug 2026 | One suburb, resident-reported. Derived: 22.1% of 226 days. |
| Joburg: leaks per day, litres lost [R] | "about 140 pipe leaks a day between June 2025 and June 2026"; "lost 207 billion litres of water in the 2025 financial year"; "R650-million on water tankers over the past five years" | same | 14 Aug 2026 | Dashboard is the data source. 140 x 365 is about 51,100 (derived). The 2024 outage record: **NOT FOUND**. |
| Leak-reporting apps in SA | LeakNet "proposes a mobile- and WhatsApp-based platform enabling real-time leak reporting and municipal feedback" | https://ukzn.ac.za/news/ukzn-students-represent-sa-at-next-generation-digital-action-programme-in-denmark/ | undated | A prototype from a challenge programme, not a live service. Also IBM Water Watchers with Tshwane (Android app, photo reports of leaks), 3BL Media 1 Apr 2013, no outcome data. CityMenderSA "36 categories" per a BizNews radio page. |
| Paid citizen leak reporting: Air Selangor (Malaysia) [R] | "enjoy a RM5 Touch 'n Go Top-up PIN when you report any of the incidents listed above through the Air Selangor app" | https://hydrohub.airselangor.com/visual/report-leaks/ | 14 Sep 2023 (to 31 Dec 2023) | A 2026 round of "1,000 Joy Rewards points worth RM10" for the first 2,000 valid reports a month is [S] only. No evidence of leaks found per reward. |
| Paid leak reporting: Korea [S] | Title only: "Reward for Leakage Reports Increased from 20,000 to 30,000 KRW" | https://cm.asiae.co.kr/en/article/2021060122561697957 | 1 Jun 2021 | Host unreachable. |
| Paid leak reporting scheme in SA | **NOT FOUND** | n/a | n/a | No paid citizen-detection scheme located in SA. |

---

## F. Minibus taxi cash

| Finding | Quote | Source URL | Date | Caveat |
|---|---|---|---|---|
| Minister's industry figures [R] | "its revenue is estimated between R60 billion and R100 billion per year, contributing 1.4% of our GDP and up to 300,000 jobs"; "eight out of every ten local commuters"; oversupply of "approximately 85,000 minibus taxis" | https://topauto.co.za/news/154848/there-are-85000-too-many-taxis-in-south-africa-transport-minister/ | 2 Jun 2026 | Press report of Minister Creecy's speech to Santaco. Best official-sounding source found. |
| Press figures [R] | "transports around 15 million commuters daily, accounting for 65% of the country's public transport usage"; "between R90 billion and R100 billion annually"; "around 600,000 individuals" | https://pretorianews.co.za/heritage-day/2025-09-28-how-the-minibus-taxi-industry-became-the-backbone-of-south-africas-economy/ | 28 Sep 2025 | Opens "According to reports", unnamed source. Conflicts with the Minister (R60-100bn, 300,000 jobs, 8 in 10 commuters) and with Quartz 2020 citing SA Taxi ("worth an estimated 50 billion rand"). Use ranges. |
| Sanity check [derived] | R60-100bn over 15m commuters over 250-365 days gives about R11-R27 per commuter-day | n/a | n/a | Derived from the unsourced numbers above, plausibility only. |
| Commuters switching away [R] | "18.1% of respondents ... in 2013 to 33.9% of respondents in 2020" | https://topauto.co.za/features/85478/south-africas-taxis-are-losing-customers-the-numbers/ | undated | Secondary relay of an unnamed transport survey. |
| Cash share of fares | **NOT RESEARCHED** | n/a | n/a | Search budget exhausted before this was reached. |
| Failed or successful cashless fare schemes | **NOT RESEARCHED** | n/a | n/a | Same. A Wikipedia fetch on shared taxis mentioned no payment pilots. |
| Stats SA National Household Travel Survey | **NOT RESEARCHED** | n/a | n/a | statssa.gov.za returned an interstitial page instead of the report. |

---

## Gaps and surprises

### Gaps
1. **F cashless taxi fares and cash share: not researched.** Search budget ran out. The most important unanswered section for a payments pitch.
2. **Rejected spaza registrations: NOT FOUND.** Only applied and approved are published. After the 28 Feb 2025 deadline no national final tally was located, and the numbers disagree: 19,386 approved (Dec 2024) versus 15,528 approved (reply dated Oct 2025).
3. **Stokvel fraud statistics: NOT FOUND.** Only single cases and one scam.
4. **African or SA retail product-image dataset: NOT FOUND.** Every expiry-date and shelf dataset is non-SA.
5. **RMIS stock-theft figure, primary source for the communal 40-50% herd share, and any SA bank livestock-collateral pilot: NOT FOUND.**
6. **Joburg 2024 outages: NOT FOUND.** Only 2025-2026 verified.
7. Kaggle and Mendeley muzzle datasets unconfirmed. Kaggle, FNB's live stokvel page and Stats SA were unreadable or bot-walled.

### Surprises
1. **NIQ is already building a field-audit census of 189,000 traditional-trade outlets** (12 May 2026) and says 12 SKUs carry 80% of sales. A shelf-photo product competes with, or must feed, that census.
2. **Pepkor merged Flash with Shop2Shop on 22 Jul 2026**, with "some 177,000 informal traders on its books" and R200bn+ annual throughput. The informal-merchant payments space is no longer empty.
3. **The R500m Spaza Shop Support Fund reached 109 verified shops by Oct 2025 and 1,319 approved by Jun 2026**, because municipal licences gate it. It excludes foreign nationals by rule.
4. **FMD was declared a national disaster in Feb 2026**, with unvaccinated animals barred from the value chain. That raises the value of per-animal identification beyond theft.
5. **Mastercard holds an active patent (US11804112B2)** covering kiosk product recognition built on Nairobi data. Needs an IP check before building on it.
6. **FNB already sells a stokvel account** (launched 17 Feb 2021) with multi-signatory payouts, yet signatories colluded in a R600,000 theft in 2023-25. The NASASA R45-50bn and 11m figures have been near-constant since 2015.
7. **Arithmetic problem in a source:** Farmer's Weekly says stock theft cost "over R7 billion" over five years, but its own yearly figures sum to R6.32bn.
8. **Licence trap:** SKU-110K is non-commercial only, and the 62.6 GB HF mirror is five times the original download.
9. **The No Drop 2023 PDF is headed "Draft"** and covers only 61% of water services authorities. The headline 47.4% is a partial-coverage figure.
10. **Muzzle accuracy of 98-99.5% is closed-set classification** on about 270 US feedlot cattle. Do not present it as SA field performance.
