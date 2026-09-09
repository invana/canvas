# Variable: NO\_ROLE

> `const` **NO\_ROLE**: `"__none__"` = `'__none__'`

Sentinel for the "no role" option. The form chrome (Radix `Select`) forbids an
empty-string item value, so the `(none)` choice carries this token instead;
[asRole](../functions/asRole.md) maps it back to `undefined`.
