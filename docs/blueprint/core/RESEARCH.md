# Primary-source ledger and diligence limits

Checked 22 October 2026 unless the linked companion record says otherwise. These sources establish documented features/guidance, not KAIRO implementation, current account entitlement or educational benefit. Provider/model details must be refreshed before selection/spend. No copyrighted material is reproduced here; conclusions are concise paraphrases with links.

| Primary source | What it supports / what remains to test |
|---|---|
| [Google Cloud Run WebSockets](https://docs.cloud.google.com/run/docs/triggering/websockets) | WebSockets can use Cloud Run but request timeouts/reconnect and state synchronization matter. Does not prove RTC/SFU hosting or session capacity. |
| [Google session affinity](https://docs.cloud.google.com/run/docs/configuring/session-affinity) | Best-effort affinity cannot be a durability guarantee. Design resumable checkpoints. |
| [Google Chirp 3 HD](https://docs.cloud.google.com/text-to-speech/docs/chirp3-hd) | Selected synchronous SSML support is Preview; streaming has separate limitations. General SSML docs cannot establish exact chosen voice's word/viseme events. |
| [Google general SSML/timepoints](https://docs.cloud.google.com/text-to-speech/docs/ssml) | Mark-based timepoints exist for supported synthesis modes; not phoneme timing or universal Chirp support. |
| [Azure visemes](https://learn.microsoft.com/en-us/azure/cognitive-services/speech-service/how-to-speech-synthesis-viseme) | Audio-offset events and differing viseme representations; Rain requires a tested mapping. Per-locale support is separate. |
| [Azure language/voice support](https://learn.microsoft.com/en-us/azure/ai-services/speech-service/language-support?tabs=stt) | IsiZulu speech and named voices, South African English features; inspect feature-specific rows. Do not infer Setswana or Zulu visemes from English. |
| [Google STT pricing](https://cloud.google.com/speech-to-text/pricing) | API V1 and V2 pricing differ. Root corrected a draft that used V1 allowance/rate for a V2 recommendation. Mode/channel/SKU still require actual probe. |
| [Google spend caps](https://docs.cloud.google.com/billing/docs/how-to/budgets-spend-caps) | Eligible scoped service caps exist but have limits/latency; not a universal cap or confirmed speech coverage. |
| [Rhubarb upstream](https://github.com/DanielSWolf/rhubarb-lip-sync) | English recognizer and language-independent phonetic mode; latter estimates mouth animation, not reliable local-language word boundaries. |
| [LiveKit turn handling](https://docs.livekit.io/agents/logic/turns/) | Framework-level turn/interruption mechanisms are available. Defaults and language models need local evaluation; do not adopt a hosted cost/quality promise. |
| [getUserMedia browser API](https://developer.mozilla.org/en-US/docs/Web/API/MediaDevices/getUserMedia) | Permission/secure-context/device constraints. KAIRO still must manage consent, cleanup and errors. |
| [YouTube IFrame API](https://developers.google.com/youtube/iframe_api_reference), [minimum functionality](https://developers.google.com/youtube/terms/required-minimum-functionality), [policies](https://developers.google.com/youtube/terms/developer-policies) | Authorized embed/control and provider rules. Not a blanket right to download/transcribe/dub every video, or a cross-origin frame-extraction API. |
| [MCP security guidance](https://modelcontextprotocol.io/docs/2025-11-25/tutorials/security/security_best_practices) | Concrete protocol risks and mitigations for authorization/proxies/SSRF/sessions. A connector is not inherently safe. |
| [NIST SSDF](https://csrc.nist.gov/pubs/sp/800/218/final), [AI profile](https://csrc.nist.gov/pubs/sp/800/218/a/final) | Secure lifecycle structure and AI-specific development considerations. Not certification evidence. |
| [OWASP ASVS](https://asvs.owasp.org/) | Versioned verification requirements for the implementation release matrix. Root confirmed stable 5.0.0 listing. |
| [POPIA official source](https://www.gov.za/documents/protection-personal-information-act) | Legal source for South African privacy design and professional review; no compliance conclusion is made. |
| [WCAG 2.2](https://www.w3.org/TR/WCAG22/) | Accessibility requirements to translate into measurable task tests; manual user/assistive-tech review still essential. |
| [NIST ML-KEM](https://csrc.nist.gov/pubs/fips/203/final) | Standardized key establishment, distinct from signatures/auth/app security. Not a reason to write custom crypto. |
| [Simba Setswana ONNX card](https://huggingface.co/Hydramus/Simba-TTS-tsn-onnx) | Concrete local TTS candidate with declared rights/size/implementation; not verified naturalness, phone performance or word alignment. |

Additional HF model/dataset and Google/Azure/UCT sources, exact IDs, licences, gating, pricing assumptions and linguistic evidence are in [speech catalog](../speech-cloud/catalog.md), [speech plan](../speech-cloud/README.md), [evaluation plan](../speech-cloud/evaluation.md). The learning blueprint separately cites IES, EEF, CAST and South African language sources, with school-oriented evidence limits explicitly stated for this adult pilot.

## Distinguish evidence levels

1. **Local source inspection:** code/types/files observed; not execution.
2. **Owner verification report:** recorded historical checks by Claude/previous work; not independently rerun here.
3. **Provider/model documentation:** feature or licence listing; not actual account/quality validation.
4. **Proposed architecture:** design decision with trade-off; not implemented.
5. **Pilot evidence:** future measurements on named devices/languages/tasks; cannot be replaced by any of the above.

The character baseline is backed by owner reports and can be independently hashed; browser/phone acceptance remains a separate permissioned activity. Research is deliberately curated around feasible mechanisms rather than claiming an exhaustive search of every technology or uniqueness across the entire market.
