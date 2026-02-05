import {
  ButtonOutline,
  Dialog,
  DialogContent,
  DialogHeader,
  SpaceVertical,
} from "@looker/components";
import { useFormik } from "formik";
import React, { useEffect } from "react";
import { useBoolean } from "usehooks-ts";
import { useToast } from "./components/Toast/ToastContext";
import useConfigContext, { IExtensionConfig } from "./ConfigContext";

const Settings: React.FC = () => {
  const { showSuccess } = useToast();
  const open = useBoolean(false);

  const { config: config_data, updateConfig } = useConfigContext();

  const { values, ...formik } = useFormik({
    validateOnChange: false,
    validateOnBlur: true,
    initialValues: {} as IExtensionConfig,
    validate: async (values) => {
      let errors: Partial<{ [key in keyof IExtensionConfig]: string }> = {};

      return errors;
    },
    onSubmit: (values) => {
      updateConfig({ ...values });
      showSuccess("Settings updated", 5000);
    },
  });
  useEffect(() => {
    formik.resetForm({ values: config_data });
  }, [config_data]);

  return (
    <>
      <ButtonOutline fullWidth onClick={() => open.setTrue()} color="neutral">
        Settings
      </ButtonOutline>
      <Dialog
        isOpen={open.value}
        onClose={async () => {
          const errors = await formik.validateForm();
          if (Object.keys(errors).length === 0) {
            await formik.handleSubmit();
            open.setFalse();
          }
        }}
      >
        <DialogHeader>Settings</DialogHeader>
        <DialogContent minHeight={"400px"}>
          <SpaceVertical gap="xsmall"></SpaceVertical>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default Settings;
