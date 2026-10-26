# Language acceptance kit

Criteria: Usability, Impact, Intelligence. Need: learners must know whether language output was checked, and must be able to correct listening output or use a text alternative. This kit defines seven proposed evaluation cases, not seven supported or validated capabilities. Every supplied case remains **not-run**.

Run `node --test tools/language-acceptance-kit/test.mjs` from the repository root. The dependency-free validator checks schema, bounded lists, review metadata and SASL review prerequisites. A reviewed metadata record requires evidence references, but this validator cannot authenticate the artifact, reviewer, consent, content rights or quality. A valid manifest never establishes accuracy or deployment readiness.

Cases cover English listening, isiZulu translation, Setswana terminology, mixed-language listening, transcript correction, unsupported-language fallback and SASL review. No reference audio, invented translations, camera input or trained model is included. SASL hand landmarks alone cannot establish translation; nonmanual features and signer review remain required. Future evaluation needs consented reference material, native/domain or qualified SASL review, declared languages, error measures and independently checked results.

Independent Luna review found generic reviewer roles could satisfy SASL review metadata. The validator now requires the explicit `qualified-sasl-reviewer` declaration for reviewed SASL cases. This remains a self-asserted metadata field, not authenticated proof of qualification. Final focused suite: 6/6 passed after the correction.

The original D chat declined; a fallback chat has no confirmed implementation activity. Root implemented this separately named package and sent the fallback a read-only review task to avoid ownership collisions. Existing PR23 listening runtime/cancellation files are unchanged.
