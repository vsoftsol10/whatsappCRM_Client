
import { useCallback, useEffect, useState } from "react";

import BackupHeader from "../components/backup/BackupHeader";
import BackupStats from "../components/backup/BackupStats";
import BackupHistory from "../components/backup/BackupHistory";

const API_URL =
  import.meta.env.VITE_API_URL || "http://localhost:5000";

const Backup = () => {
  const [backups, setBackups] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [creating, setCreating] = useState(false);
  const [downloadingId, setDownloadingId] = useState(null);
  const [error, setError] = useState("");

  // =========================================================
  // GET AUTH TOKEN
  // =========================================================

  const getToken = () => {
    return (
      localStorage.getItem("token") ||
      localStorage.getItem("accessToken")
    );
  };

  // =========================================================
  // FETCH BACKUPS
  // GET /api/backups
  // =========================================================

  const fetchBackups = useCallback(
    async (showRefresh = false) => {
      try {
        if (showRefresh) {
          setRefreshing(true);
        } else {
          setLoading(true);
        }

        setError("");

        const token = getToken();

        if (!token) {
          throw new Error("Authentication token not found");
        }

        const response = await fetch(
          `${API_URL}/api/backups`,
          {
            method: "GET",
            headers: {
              Authorization: `Bearer ${token}`,
              "Content-Type": "application/json",
            },
          }
        );

        const data = await response.json();

        if (!response.ok) {
          throw new Error(
            data.message || "Failed to fetch backups"
          );
        }

        setBackups(data.backups || []);
      } catch (err) {
        console.error("Fetch backups error:", err);

        setError(
          err.message || "Failed to fetch backups"
        );
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    []
  );

  // =========================================================
  // LOAD BACKUPS ON PAGE LOAD
  // =========================================================

  useEffect(() => {
    fetchBackups();
  }, [fetchBackups]);

  // =========================================================
  // CREATE BACKUP
  // POST /api/backups
  // =========================================================

  const handleCreateBackup = async () => {
    try {
      setCreating(true);
      setError("");

      const token = getToken();

      if (!token) {
        throw new Error("Authentication token not found");
      }

      const response = await fetch(
        `${API_URL}/api/backups`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.message || "Failed to create backup"
        );
      }

      // Refresh backup history after successful creation
      await fetchBackups();

      alert("CRM backup created successfully.");
    } catch (err) {
      console.error("Create backup error:", err);

      setError(
        err.message || "Failed to create backup"
      );
    } finally {
      setCreating(false);
    }
  };

  // =========================================================
  // DOWNLOAD BACKUP
  // GET /api/backups/:id/download
  // =========================================================

  const handleDownload = async (backup) => {
    try {
      setDownloadingId(backup.id);
      setError("");

      const token = getToken();

      if (!token) {
        throw new Error("Authentication token not found");
      }

      const response = await fetch(
        `${API_URL}/api/backups/${backup.id}/download`,
        {
          method: "GET",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      // If download fails, backend should return JSON
      if (!response.ok) {
        let message = "Failed to download backup";

        try {
          const data = await response.json();

          message =
            data.message || message;
        } catch {
          // Response may not be JSON
        }

        throw new Error(message);
      }

      // Convert response to ZIP blob
      const blob = await response.blob();

      if (!blob || blob.size === 0) {
        throw new Error(
          "Backup file is empty or unavailable"
        );
      }

      // Create temporary download URL
      const url =
        window.URL.createObjectURL(blob);

      // Create download element
      const link =
        document.createElement("a");

      link.href = url;

      link.download =
        backup.fileName ||
        `vatup-backup-${backup.id}.zip`;

      document.body.appendChild(link);

      link.click();

      link.remove();

      // Release temporary URL
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error(
        "Download backup error:",
        err
      );

      setError(
        err.message ||
          "Failed to download backup"
      );
    } finally {
      setDownloadingId(null);
    }
  };

  // =========================================================
  // PAGE
  // =========================================================

  return (
    <div className="min-h-full bg-gray-50 p-4 md:p-6 lg:p-8">

      {/* HEADER */}
      <BackupHeader
        onCreateBackup={handleCreateBackup}
        onRefresh={() => fetchBackups(true)}
        creating={creating}
        refreshing={refreshing}
      />

      {/* ERROR MESSAGE */}
      {error && (
        <div className="mb-6 flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 p-4">

          <div>
            <p className="text-sm font-semibold text-red-800">
              Backup Error
            </p>

            <p className="mt-1 text-sm text-red-600">
              {error}
            </p>
          </div>

        </div>
      )}

      {/* LOADING */}
      {loading ? (
        <div className="rounded-xl border border-gray-200 bg-white p-10 text-center shadow-sm">

          <div className="mx-auto h-8 w-8 animate-spin rounded-full border-2 border-gray-200 border-t-green-600" />

          <p className="mt-4 text-sm text-gray-500">
            Loading backup history...
          </p>

        </div>
      ) : (
        <>
          {/* STATS */}
          <BackupStats
            backups={backups}
          />

          {/* HISTORY */}
          <BackupHistory
            backups={backups}
            onDownload={handleDownload}
            downloadingId={downloadingId}
          />
        </>
      )}

    </div>
  );
};

export default Backup;

