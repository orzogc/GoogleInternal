export const QUERY_PARAMS = {
  PRETTY_PRINT: ["$prettyPrint", "$prettyprint", "$pp", "prettyPrint", "pp", "prettyprint"],
  FIELDS: ["$fields", "fields"],
  ERROR_FORMAT: ["$.xgafv", "$apiFormat", ".xgafv"],
  TRACE: ["$trace", "trace"],
  CALLBACK: ["$callback", "callback"],
  ALT: ["$alt", "alt"],
  USER_IP: ["$userIp", "userIp"],
  UPLOAD_PROTOCOL: ["$upload_protocol", "upload_protocol"],
};

export const HEADERS = {
  RESPONSE_ENCODING: "x-response-encoding",
  GOOG_EXT: "x-goog-ext-",
  PROTOBUF_TYPE: "x-protobuf-type",
};

export const WKT_URLS = {
  ANY: "type.googleapis.com/google.protobuf.Any",
  TIMESTAMP: "type.googleapis.com/google.protobuf.Timestamp",
  DURATION: "type.googleapis.com/google.protobuf.Duration",
  STRUCT: "type.googleapis.com/google.protobuf.Struct",
  VALUE: "type.googleapis.com/google.protobuf.Value",
  LIST_VALUE: "type.googleapis.com/google.protobuf.ListValue",
};
