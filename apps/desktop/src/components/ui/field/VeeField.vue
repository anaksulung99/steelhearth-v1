<!-- eslint-disable vue/first-attribute-linebreak -->
<script setup lang="ts">
import type { HTMLAttributes } from "vue";
import { useField, useIsFormTouched } from "vee-validate";
import { toValue } from "vue";

interface VeeFieldProps extends /* @vue-ignore */ HTMLAttributes {
  name: string;
}

const props = defineProps<VeeFieldProps>();

const { value, errors, handleBlur, handleChange } = useField(
  toValue(() => props.name)
);

const isTouched = useIsFormTouched();

const isValid = useIsFieldValid(props.name);

const fieldId = `${props.name}-field`;
</script>

<template>
  <Field :data-invalid="!!errors.length" :class="props.class">
    <slot
      :field="{
        value,
        errors,
        handleBlur,
        handleChange,
        isTouched,
        isValid,
        fieldId,
        name: props.name,
      }"
    />
  </Field>
</template>
