export const formatRut = (rut: string): string => {
  // Remove non-alphanumeric
  let value = rut.replace(/[^0-9kK]/g, '');
  if (value.length > 1) {
    const dv = value.slice(-1);
    const body = value.slice(0, -1);
    // Format with dots
    let formattedBody = '';
    for (let i = body.length - 1, j = 0; i >= 0; i--, j++) {
      if (j > 0 && j % 3 === 0) formattedBody = '.' + formattedBody;
      formattedBody = body[i] + formattedBody;
    }
    return `${formattedBody}-${dv.toUpperCase()}`;
  }
  return value;
};

export const validateRut = (rut: string): boolean => {
  if (!/^[0-9]{1,2}\.[0-9]{3}\.[0-9]{3}-[0-9kK]{1}$/.test(rut)) return false;
  const cleanRut = rut.replace(/[\.-]/g, '');
  const body = cleanRut.slice(0, -1);
  const dv = cleanRut.slice(-1).toUpperCase();

  let sum = 0;
  let multiplier = 2;

  for (let i = body.length - 1; i >= 0; i--) {
    sum += parseInt(body[i]) * multiplier;
    multiplier = multiplier === 7 ? 2 : multiplier + 1;
  }

  const expectedDv = 11 - (sum % 11);
  let computedDv = '';
  if (expectedDv === 11) computedDv = '0';
  else if (expectedDv === 10) computedDv = 'K';
  else computedDv = expectedDv.toString();

  return computedDv === dv;
};

export const isValidUUID = (uuid: string): boolean => {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[45][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  return uuidRegex.test(uuid);
};
