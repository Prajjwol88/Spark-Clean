// Middle layer: validates and maps a client record.
class clsClient {
  static fromForm(body) {
    const client = new clsClient();
    const fields = [
      ['FullName', 'fullName', 'Full name', 100],
      ['Email', 'email', 'Email', 250],
      ['Address', 'address', 'Address', 500],
      ['Postcode', 'postcode', 'Postcode', 20]
    ];
    for (const [property, key, label, limit] of fields) {
      const value = typeof body?.[key] === 'string' ? body[key].trim() : '';
      if (!value || value.length > limit) {
        return { error: `${label} must be between 1 and ${limit} characters.` };
      }
      client[property] = value;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(client.Email)) {
      return { error: 'Enter a valid email address.' };
    }
    return { client };
  }

  loadFromRow(row) {
    this.ClientNo = Number(row.ClientNo);
    this.FullName = row.FullName;
    this.Email = row.Email;
    this.Address = row.Address;
    this.Postcode = row.Postcode;
    this.DateRegistered = row.DateRegistered;
    this.Active = Number(row.Active) === 1;
  }

  toJSON() {
    return {
      clientId: this.ClientNo,
      fullName: this.FullName,
      email: this.Email,
      address: this.Address,
      postcode: this.Postcode,
      registrationDate: this.DateRegistered,
      isActive: this.Active
    };
  }
}

module.exports = clsClient;
