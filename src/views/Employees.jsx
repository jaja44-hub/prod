import React, { useEffect, useState } from 'react';
import * as GW from '../../src/services/ServiceGateway';

export default function Employees() {
  const [list, setList] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const docs = await GW.getEmployees();
        setList(docs || []);
      } catch (err) {
        setList([]);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  return (
    <div style={{ padding: 20 }}>
      <h2>Employees</h2>
      {loading ? <p>Loading…</p> : (
        <ul>
          {list.map((e) => (
            <li key={e.id}>{e.name || e.email} — {e.role || 'Staff'}</li>
          ))}
        </ul>
      )}
    </div>
  );
}
