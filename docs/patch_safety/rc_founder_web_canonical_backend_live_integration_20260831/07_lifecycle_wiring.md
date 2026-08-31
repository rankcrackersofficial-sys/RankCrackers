# Lifecycle wiring
Realm rows use governed callable actions with confirmation, 12-character reason, request ID, deterministic audit and atomic projections.
Canonical identity mismatch now fails closed before lifecycle writes.
Legacy realm-missing rows never receive lifecycle controls.
