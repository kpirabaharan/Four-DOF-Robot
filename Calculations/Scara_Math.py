import sympy as sp

# Variables
t1, t2, t3, d1 = sp.symbols("t1 t2 t3 d1")

# Constants
a1 = 228.0
a2 = 136.5
d3 = 60
d4 = 25
d5 = 105

# DH Table
DH = sp.Matrix(
    [
        [sp.pi, 0, d1, 0],
        [0, 0, 0, t1],
        [0, a1, d3, t2],
        [sp.pi, a2, d4, t3],
        [0, 0, d5, 0],
    ]
)


# Transformation Matrix Function
def T_Matrix(params):
    alpha, a, d, theta = params
    return sp.Matrix(
        [
            [sp.cos(theta), -sp.sin(theta), 0, a],
            [
                sp.sin(theta) * sp.cos(alpha),
                sp.cos(theta) * sp.cos(alpha),
                -sp.sin(alpha),
                -sp.sin(alpha) * d,
            ],
            [
                sp.sin(theta) * sp.sin(alpha),
                sp.cos(theta) * sp.sin(alpha),
                sp.cos(alpha),
                sp.cos(alpha) * d,
            ],
            [0, 0, 0, 1],
        ]
    )


# Transformation Matrices
T01 = T_Matrix(DH.row(0))
T12 = T_Matrix(DH.row(1))
T23 = T_Matrix(DH.row(2))
T34 = T_Matrix(DH.row(3))
T45 = T_Matrix(DH.row(4))

# Overall Transformation Matrix
T05exp = T01 * T12 * T23 * T34 * T45
T05 = sp.simplify(T05exp)

# Display the result
# sp.pprint(T01)
# sp.pprint(T12)
# sp.pprint(T23)
# sp.pprint(T34)
# sp.pprint(T45)
sp.pprint(T05)
