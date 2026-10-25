# Public learning source registry

Checked 21 October 2026. The user's BCom Business Informatics material is a private test collection for the ingestion system, not the boundary of KAIRO's subject coverage. The machine-readable registry is `tools/course_sources/public_sources.json`. Discovery, verified playback, usable transcript, ingestion approval and redistribution permission are different states.

| Source | Concrete starting point | Suitable exploration | Status and boundary |
|---|---|---|---|
| Wits | [CLTD Open Educational Resources](https://www.wits.ac.za/cltd/resources/open-educational-resources/) | academic video collections, demonstrations and education resources | Official page verified; it links academic video playlists and describes Creative Commons resources. Check each item's terms. |
| Wits video collection | [OER video playlists](https://www.youtube.com/@oervideos5307/playlists) | video search and in-studio viewing | Linked by Wits. Direct YouTube fetch was unavailable; playback/transcripts have not been tested. |
| UCT | [OpenUCT OER collection](https://open.uct.ac.za/browse/title?scope=3b16169d-bc19-4573-a2fb-84acfa24bb0b) | cross-disciplinary source discovery | Repository verified; inspect each item's licence, metadata and suitability. |
| UCT courses | [CILT MOOCs](https://cilt.uct.ac.za/projects/uct-massive-open-online-courses-moocs) | science, health, business and social innovation | Official catalogue verified. Access/certificate arrangements vary; free enrolment does not imply all completion or reuse is free. |
| UCT health | [Health education MOOCs](https://health.uct.ac.za/health-edu/health-open-educational-resources-oer/moocs) | future health/anatomy learning references | Official discovery page found; no medical simulation or content licence validated here. |
| UJ | [UJ Digital: free-course filter](https://ujdigital.uj.ac.za/Course/Browse?enrollmentStillOpen=True&page=1&price=free&sort=latest) | digital literacy, AI and financial literacy | Free offerings verified in the official catalogue. No enrolment or content copying performed. |
| WeThinkCode_ | [Official programme site](https://wethinkcode.co.za/) | programming and AI pathways | Public programme discovery verified. A separately indexed curriculum PDF carries a confidentiality/no-sharing notice, so it was excluded from automatic ingestion. A whole reusable open curriculum has not been established. |
| TUT | [Library open-access materials](https://libraries.tut.ac.za/tutnew/index.php/component/content/article/102-open-access-materials.html?Itemid=437&catid=19) | computing, law, business, economics, maths, health and engineering | Official directory found; it links providers rather than licensing all their works. |
| MIT OCW | [Circuits and Electronics](https://ocw.mit.edu/courses/6-002-circuits-and-electronics-spring-2007/) | engineering demonstrations, problems and circuit visualizations | Course resources verified. [OCW terms](https://ocw.mit.edu/pages/privacy-and-terms-of-use/) generally use CC BY-NC-SA with exceptions; not cleared as unrestricted commercial KAIRO content. |
| MIT video example | [Lecture 1: Introduction and Lumped Abstraction](https://ocw.mit.edu/courses/6-002-circuits-and-electronics-spring-2007/resources/lecture-1/) | source-linked viewing with notes and scene transitions | Official page lists video, transcript section and YouTube embed `AfQxyVuLeCs`. Player operation and transcript retrieval remain untested. No media downloaded. |
| MIT CS/robotics | [6.01 resource index](https://ocw.mit.edu/courses/6-01sc-introduction-to-electrical-engineering-and-computer-science-i-spring-2011/pages/resource-index/) | circuits, robotics, software design and worked problems | Official index verified. Item-level OCW terms apply. |
| OpenStax | [Financial Accounting preface](https://openstax.org/books/principles-financial-accounting/pages/preface) | accounting source discovery | Link-only for now. Current pages state noncommercial/share-alike conditions and additional AI-ingestion permission language. Excluded from automatic generative-AI ingestion pending appropriate permission/review. |

No private learner files were sent to these providers. Public pages were used for source discovery, not bulk book/video scraping. Do not infer permission from a domain name, a search result's “free” label or a university affiliation. Store author, title, institution, original URL, fetched date, licence URL, allowed uses and any unresolved limits per item.

## Video behaviour to build

Use the [official YouTube IFrame API](https://developers.google.com/youtube/iframe_api_reference) for a provider-controlled player. A learner clicks to load/play it; KAIRO can maintain timestamp notes, pause for a question and link to the original. Embedding availability is checked for the chosen video. Store video ID and timestamp references rather than copying a video by default. Show an external-link fallback when embedding fails.

Transcripts need an actual available source: creator-provided captions/transcripts, permitted platform access, or user-provided audio/video for transcription. No “fetch any YouTube transcript” capability is claimed. Keep ASR timing, language, confidence/review and provenance separate from verified quotations. A transcript containing instructions is still source content, not authority to call tools.

## Demonstration diversity

Use the private INF material to exercise code/SQL pages, DSC/ECS to exercise maths/tables, FAC to exercise numerical statements, and MNG/AUI/AUE to exercise cases and prose. Public engineering/video sources give a separate non-BCom path. Broader law, health and industrial scenes require their own authoritative references and domain validation. Catalogue discovery alone does not make a source an endorsed or validated lesson.
