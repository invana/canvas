# Interface: NodeStyleFormState

react-hook-form state shape. `<ObjectField name="style" …>` registers each
leaf under `style.<field>`, so the form's values nest under a `style` key.
This is the type the consumer parameterises its `useForm` with.

## Properties

### style

> **style**: [`NodeStyleFields`](../type-aliases/NodeStyleFields.md)
