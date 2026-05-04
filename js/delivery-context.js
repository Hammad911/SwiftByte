/**
 * SwiftBite — saved delivery details (localStorage).
 */
(function (global) {
  const KEY = "swiftbite_delivery_v1";

  function read() {
    try {
      const raw = global.localStorage.getItem(KEY);
      return raw ? JSON.parse(raw) : {};
    } catch {
      return {};
    }
  }

  function write(data) {
    global.localStorage.setItem(KEY, JSON.stringify(data));
  }

  function get() {
    const d = read();
    return {
      addressLine: typeof d.addressLine === "string" ? d.addressLine : "",
      flatOrBlock: typeof d.flatOrBlock === "string" ? d.flatOrBlock : "",
      phone: typeof d.phone === "string" ? d.phone : "",
      instructions: typeof d.instructions === "string" ? d.instructions : ""
    };
  }

  function set(partial) {
    const cur = read();
    write({ ...cur, ...partial });
  }

  global.SwiftBiteDelivery = { get, set };
})(window);
