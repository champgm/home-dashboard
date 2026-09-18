# POC security audit checklist

- [ ] Secret scan source/build/log/fixture/evidence outputs.
- [ ] Confirm setup code and session material are memory-only.
- [ ] Confirm controller/pairing records are only in `expo-secure-store`.
- [ ] Confirm Android backup/data-transfer is disabled for the POC.
- [ ] Confirm no arbitrary host/port, raw request, or arbitrary characteristic UI exists.
- [ ] Confirm public, loopback, unspecified, stale, and unrelated-interface endpoints are rejected.
- [ ] Confirm release-like logging does not include protocol payloads.
- [ ] Review dependency licenses separately from HAP specification-use authorization.
- [ ] Record accessory-side removal, local deletion, and prior-association restoration separately.
