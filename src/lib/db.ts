import { init } from "@instantdb/react";
import schema from "../../instant.schema";

export const db = init({
  appId: "4a786661-803d-4c57-94e1-f93d5f0c5319",
  schema,
});
