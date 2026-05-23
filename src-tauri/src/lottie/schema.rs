use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Serialize, Deserialize)]
#[allow(dead_code)]
pub struct Animation {
    pub v: String,
    pub fr: f64,
    pub ip: f64,
    pub op: f64,
    pub w: u32,
    pub h: u32,
    pub nm: String,
    pub ddd: u8,
    pub assets: Vec<serde_json::Value>,
    pub layers: Vec<serde_json::Value>,
}
