import { pool } from "../config/db.js";

/* =========================
   OBTENER TODOS LOS AUTOS
========================= */
export const getAutos = async (req, res, next) => {
    try {
        const { rows } = await pool.query(
            "SELECT * FROM autos ORDER BY creado_en DESC"
        );
        res.json(rows);
    } catch (err) {
        next(err);
    }
};

/* =========================
   OBTENER AUTO POR ID
========================= */
export const getAutoById = async (req, res, next) => {
    try {
        const { id } = req.params;

        const { rows } = await pool.query(
            "SELECT * FROM autos WHERE id = $1",
            [id]
        );

        if (rows.length === 0) {
            return res.status(404).json({ message: "Auto no encontrado" });
        }

        res.json(rows[0]);
    } catch (err) {
        next(err);
    }
};

/* =========================
   CREAR AUTO
========================= */
export const createAuto = async (req, res, next) => {
    try {
        const { marca, modelo, anio, precio, descripcion } = req.body;

        const { rows } = await pool.query(
            `INSERT INTO autos (marca, modelo, anio, precio, descripcion)
             VALUES ($1, $2, $3, $4, $5)
             RETURNING *`,
            [marca, modelo, anio, precio, descripcion]
        );

        res.status(201).json(rows[0]);
    } catch (err) {
        next(err);
    }
};

/* =========================
   ACTUALIZAR AUTO
========================= */
export const updateAuto = async (req, res, next) => {
    try {
        const { id } = req.params;
        const { marca, modelo, anio, precio, estado, descripcion } = req.body;

        const { rowCount, rows } = await pool.query(
            `UPDATE autos
             SET marca=$1, modelo=$2, anio=$3, precio=$4,
                 estado=$5, descripcion=$6,
                 actualizado_en=now()
             WHERE id=$7
             RETURNING *`,
            [marca, modelo, anio, precio, estado, descripcion, id]
        );

        if (rowCount === 0) {
            return res.status(404).json({ message: "Auto no encontrado" });
        }

        res.json(rows[0]);
    } catch (err) {
        next(err);
    }
};

/* =========================
   ELIMINAR AUTO
========================= */
export const deleteAuto = async (req, res, next) => {
    try {
        const { id } = req.params;

        const { rowCount } = await pool.query(
            "DELETE FROM autos WHERE id = $1",
            [id]
        );

        if (rowCount === 0) {
            return res.status(404).json({ message: "Auto no encontrado" });
        }

        res.json({ message: "Auto eliminado correctamente" });
    } catch (err) {
        next(err);
    }
};
