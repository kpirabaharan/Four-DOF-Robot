% Forward Kinematics of Scara Robot %
close all
clear
clc

%% Variables
syms t1 t2 t3 d1
% t1 = pi/2;
% t2 = pi/2;
% t3 = pi/2;
% d1 = 50;

%% Constants
a1 = 228;
a2 = 136.5;
d3 = 60;
d4 = 25;
d5 = 105;

%% DH Table
DH = [pi 0 d1 0;
    0 0 0 t1;
    0 a1 d3 t2;
    0 a2 d4 t3;
    0 0 d5 0]

%% Transformation Matrix
T01 = T_Matrix(DH(1,:));
T12 = T_Matrix(DH(2,:));
T23 = T_Matrix(DH(3,:));
T34 = T_Matrix(DH(4,:));
T45 = T_Matrix(DH(5,:));

T05exp = T01 * T12 * T23 * T34 * T45;
T05 = simplify(T05exp);
