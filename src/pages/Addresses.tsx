import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { FiArrowLeft, FiCheck, FiEdit2, FiMapPin, FiPlus, FiTrash2 } from "react-icons/fi";
import {
  fetchAddresses,
  saveAddress,
  deleteAddress,
  selectAddress,
} from "../services/api";
import { hasToken } from "../lib/authGate";
import AddressModal, { type AddressFormValues } from "../components/shared/AddressModal";
import { toast } from "../store/toastStore";
import "./Addresses.css";

interface Addr {
  _id: string;
  fullName?: string;
  email?: string;
  phone?: string;
  addressType?: "Home" | "Work" | string;
  houseNo?: string;
  apartment?: string;
  address?: string;
  city?: string;
  state?: string;
  pinCode?: number | string;
  pincode?: number | string;
  isSelected?: boolean;
  isDefault?: boolean;
}

const formatLine = (a: Addr) =>
  [a.houseNo, a.apartment, a.address, a.city, a.state, a.pinCode || a.pincode]
    .filter((v) => v != null && String(v).trim() !== "")
    .join(", ");

export default function Addresses() {
  const navigate = useNavigate();
  const [addresses, setAddresses] = useState<Addr[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    const res: any = await fetchAddresses();
    const raw =
      res?.data?.UserAddress || res?.data?.addresses || res?.data || [];
    setAddresses(Array.isArray(raw) ? raw : []);
    setLoading(false);
  }, []);

  useEffect(() => {
    if (!hasToken()) {
      navigate("/login?next=/addresses", { replace: true });
      return;
    }
    load();
  }, [navigate, load]);

  const openAdd = () => {
    setEditingId(null);
    setShowModal(true);
  };
  const openEdit = (a: Addr) => {
    setEditingId(a._id);
    setShowModal(true);
  };
  const closeModal = () => {
    setShowModal(false);
    setEditingId(null);
  };

  const editingInitial = (() => {
    if (!editingId) return undefined;
    const a = addresses.find((x) => x._id === editingId);
    if (!a) return undefined;
    const v: Partial<AddressFormValues> = {
      fullName: a.fullName || "",
      email: a.email || "",
      pincode: String(a.pinCode || a.pincode || ""),
      city: a.city || "",
      state: a.state || "",
      houseNo: a.houseNo || "",
      apartment: a.apartment || "",
      addressType: (a.addressType as "Home" | "Work") || "Home",
    };
    return v;
  })();

  const handleSave = async (data: AddressFormValues) => {
    const body: any = {
      fullName: data.fullName.trim(),
      email: data.email.trim(),
      city: data.city.trim(),
      state: data.state.trim(),
      pinCode: parseInt(data.pincode, 10) || 0,
      houseNo: data.houseNo.trim(),
      apartment: data.apartment.trim(),
      address: [data.houseNo, data.apartment, data.city, data.state]
        .filter(Boolean)
        .map((s) => s.trim())
        .join(", "),
      addressType: data.addressType,
    };
    if (editingId) body.addressId = editingId;

    const r: any = await saveAddress(body);
    if (r?.code !== 1) {
      toast.error(r?.message || "Could not save address");
      return;
    }
    toast.success(editingId ? "Address updated" : "Address added");
    closeModal();
    load();
  };

  const handleDelete = async (a: Addr) => {
    if (!confirm("Delete this address?")) return;
    const r: any = await deleteAddress(a._id);
    if (r?.code !== 1) {
      toast.error(r?.message || "Could not delete");
      return;
    }
    toast.success("Address removed");
    load();
  };

  const handleSetDefault = async (a: Addr) => {
    if (a.isSelected) return;
    // Optimistic flip.
    setAddresses((arr) =>
      arr.map((x) => ({ ...x, isSelected: x._id === a._id })),
    );
    const r: any = await selectAddress(a._id);
    if (r?.code !== 1) {
      toast.error(r?.message || "Could not set as default");
      load();
      return;
    }
    toast.success("Default address updated");
  };

  return (
    <div className="container addresses-page">
      <button className="back-link" onClick={() => navigate("/profile")}>
        <FiArrowLeft /> Back to profile
      </button>

      <div className="addresses-head">
        <h1>Saved Addresses</h1>
        <button className="btn btn-primary" onClick={openAdd}>
          <FiPlus /> Add Address
        </button>
      </div>

      {loading ? (
        <div className="spinner" />
      ) : addresses.length === 0 ? (
        <div className="empty">
          You haven't saved any addresses yet.
          <div style={{ marginTop: 12 }}>
            <button className="btn btn-primary" onClick={openAdd}>
              <FiPlus /> Add your first address
            </button>
          </div>
        </div>
      ) : (
        <div className="addr-cards">
          {addresses.map((a) => (
            <div
              key={a._id}
              className={`addr-card${a.isSelected ? " selected" : ""}`}
            >
              <div className="addr-card-head">
                <FiMapPin />
                <strong>
                  {a.fullName || "Address"}
                  {a.addressType ? ` · ${a.addressType}` : ""}
                </strong>
                {a.isSelected && (
                  <span className="addr-default-tag">
                    <FiCheck /> Default
                  </span>
                )}
              </div>
              <div className="addr-card-body">{formatLine(a)}</div>
              {(a.email || a.phone) && (
                <div className="addr-card-meta">
                  {a.email && <span>{a.email}</span>}
                  {a.phone && <span>{a.phone}</span>}
                </div>
              )}
              <div className="addr-card-actions">
                {!a.isSelected && (
                  <button
                    className="btn btn-outline-primary"
                    onClick={() => handleSetDefault(a)}
                  >
                    Set as default
                  </button>
                )}
                <button
                  className="btn-icon"
                  aria-label="Edit"
                  onClick={() => openEdit(a)}
                  title="Edit"
                >
                  <FiEdit2 />
                </button>
                <button
                  className="btn-icon danger"
                  aria-label="Delete"
                  onClick={() => handleDelete(a)}
                  title="Delete"
                >
                  <FiTrash2 />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      <AddressModal
        open={showModal}
        initialValues={editingInitial}
        onClose={closeModal}
        onSave={handleSave}
      />
    </div>
  );
}
