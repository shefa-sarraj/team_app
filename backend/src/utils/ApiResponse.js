function success(data) {
  return { success: true, data, message: null };
}

function failure(message) {
  return { success: false, data: null, message };
}

module.exports = { success, failure };
