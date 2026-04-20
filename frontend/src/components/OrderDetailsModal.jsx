import React, { useEffect, useMemo, useState } from "react";
import { MapContainer, Marker, TileLayer } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";

// Fix default marker icon paths for bundlers
const DefaultIcon = L.icon({
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
});
L.Marker.prototype.options.icon = DefaultIcon;

function formatMoney(value) {
  return `Rs ${Number(value || 0).toFixed(0)}`;
}

async function geocode(query, signal) {
  const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}`;
  const res = await fetch(url, { signal, headers: { Accept: "application/json" } });
  const data = await res.json().catch(() => []);
  if (!Array.isArray(data) || data.length === 0) return null;
  const first = data[0];
  const lat = Number(first.lat);
  const lon = Number(first.lon);
  if (!Number.isFinite(lat) || !Number.isFinite(lon)) return null;
  return { lat, lon, display: first.display_name };
}

export function OrderDetailsModal({ open, onClose, request }) {
  const [geo, setGeo] = useState(null);
  const [geoError, setGeoError] = useState("");
  const [geoBusy, setGeoBusy] = useState(false);

  const isOrder = request?.type === "order";
  const isAccepted = request?.status === "accepted" || request?.status === "completed";

  const address = useMemo(() => {
    const fromProfile = request?.customer?.customerProfile?.defaultAddress;
    const fallback = request?.customer?.location;
    return String(fromProfile || fallback || "").trim();
  }, [request]);

  useEffect(() => {
    if (!open) return;
    setGeo(null);
    setGeoError("");
    if (!isAccepted || !address) return;

    const controller = new AbortController();
    setGeoBusy(true);
    geocode(address, controller.signal)
      .then((result) => {
        if (!result) {
          setGeoError("Unable to locate this address on the map.");
          return;
        }
        setGeo(result);
      })
      .catch((err) => {
        if (err?.name === "AbortError") return;
        setGeoError("Map lookup failed. Please try again.");
      })
      .finally(() => setGeoBusy(false));

    return () => controller.abort();
  }, [open, address, isAccepted]);

  if (!open || !request) return null;

  return (
    <div className="modal-backdrop" role="dialog" aria-modal="true">
      <div className="modal-card card">
        <div style={{ display: "flex", justifyContent: "space-between", gap: 12, alignItems: "center" }}>
          <div>
            <div className="title">Order details</div>
            <div className="subtitle" style={{ marginTop: 6 }}>
              Status: <span style={{ fontWeight: 900 }}>{request.status}</span> · Type: {isOrder ? "Order" : "Service"}
            </div>
          </div>
          <button className="btn secondary" type="button" onClick={onClose}>
            Close
          </button>
        </div>

        <div className="row" style={{ marginTop: 14, gap: 12 }}>
          <div style={{ flex: 1, minWidth: 240 }}>
            <div className="subtitle">Customer</div>
            <div style={{ fontWeight: 950, marginTop: 6 }}>{request.customer?.name ?? "Customer"}</div>

            <div style={{ marginTop: 10 }}>
              <div className="subtitle">Order total</div>
              <div style={{ fontWeight: 950, marginTop: 6 }}>{formatMoney(request.totalAmount)}</div>
            </div>

            {isOrder && request.items?.length ? (
              <div style={{ marginTop: 12, display: "flex", flexDirection: "column", gap: 6 }}>
                <div className="subtitle">Items</div>
                {request.items.map((item) => (
                  <div key={`${request.id}-${item.productId}`} style={{ display: "flex", justifyContent: "space-between", gap: 12 }}>
                    <span style={{ fontWeight: 800 }}>
                      {item.name} x {item.quantity}
                    </span>
                    <span className="vendor-sub" style={{ marginTop: 0 }}>
                      {formatMoney(item.subtotal)}
                    </span>
                  </div>
                ))}
              </div>
            ) : null}
          </div>

          <div style={{ flex: 1.2, minWidth: 260 }}>
            <div className="subtitle">Location verification</div>
            {!isAccepted ? (
              <div className="card" style={{ marginTop: 10, background: "rgba(15,23,42,0.02)" }}>
                <div style={{ fontWeight: 900 }}>Hidden until accepted</div>
                <div className="vendor-sub" style={{ marginTop: 6 }}>
                  Accept the order to reveal the customer delivery location for verification.
                </div>
              </div>
            ) : (
              <>
                <div className="card" style={{ marginTop: 10, background: "rgba(15,23,42,0.02)" }}>
                  <div style={{ fontWeight: 900 }}>Delivery address</div>
                  <div className="vendor-sub" style={{ marginTop: 6 }}>
                    {address || "Not provided yet (customer has no address set)."}
                  </div>
                  <div className="vendor-sub" style={{ marginTop: 6 }}>
                    Customer location: {request.customer?.location || "-"}
                  </div>
                </div>

                <div style={{ marginTop: 12 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", gap: 12, alignItems: "center" }}>
                    <div style={{ fontWeight: 950 }}>Map view</div>
                    <div className="vendor-sub" style={{ marginTop: 0 }}>
                      {geoBusy ? "Locating..." : geo?.display ? "Located" : ""}
                    </div>
                  </div>

                  {geoError ? <div className="danger" style={{ marginTop: 10 }}>{geoError}</div> : null}

                  {geo ? (
                    <div className="map-shell">
                      <MapContainer center={[geo.lat, geo.lon]} zoom={13} style={{ height: "100%", width: "100%" }}>
                        <TileLayer
                          attribution='&copy; OpenStreetMap contributors'
                          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                        />
                        <Marker position={[geo.lat, geo.lon]} />
                      </MapContainer>
                    </div>
                  ) : (
                    <div className="card" style={{ marginTop: 10, background: "rgba(15,23,42,0.02)" }}>
                      <div className="vendor-sub" style={{ marginTop: 0 }}>
                        {address ? "Map will appear once the address is located." : "No address available to show on map."}
                      </div>
                    </div>
                  )}
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

